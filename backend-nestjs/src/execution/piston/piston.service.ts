import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import { canonicalLanguage } from '../execution.types';
import { pistonConfig } from './piston.config';
import {
  PistonRequest,
  PistonResponse,
  PistonRuntime,
  PistonStage,
  PistonUnavailableError,
} from './piston.types';

@Injectable()
export class PistonService implements OnModuleDestroy {
  readonly config = pistonConfig();
  private readonly logger = new Logger(PistonService.name);
  private readonly http: AxiosInstance = axios.create({
    baseURL: this.config.baseURL,
    timeout: this.config.requestTimeout,
    maxContentLength: 2_000_000,
    maxBodyLength: 2_000_000,
    maxRedirects: 0,
    // Never route source code through an environment HTTP proxy.
    proxy: false,
  });
  private registry: PistonRuntime[] = [];
  private refreshedAt = 0;
  private refresh?: Promise<PistonRuntime[]>;
  private active = 0;
  private failures = 0;
  private openUntil = 0;
  private closing = false;
  private readonly controllers = new Set<AbortController>();
  private readonly counters = {
    requests: 0,
    failures: 0,
    latencyMs: 0,
    languages: {} as Record<string, number>,
  };

  invalidateRuntimes() {
    this.refreshedAt = 0;
    this.registry = [];
  }
  metrics() {
    return {
      ...this.counters,
      languages: { ...this.counters.languages },
      active: this.active,
      circuitOpen: this.openUntil > Date.now(),
    };
  }

  async runtimes(force = false): Promise<PistonRuntime[]> {
    if (
      !force &&
      this.refreshedAt &&
      Date.now() - this.refreshedAt < this.config.cacheTtl
    )
      return this.registry;
    if (this.refresh) return this.refresh;
    this.refresh = (async () => {
      try {
        const { data } = await this.http.get<unknown>('/runtimes');
        if (
          !Array.isArray(data) ||
          data.some(
            (r) =>
              !r ||
              typeof r.language !== 'string' ||
              typeof r.version !== 'string' ||
              !Array.isArray(r.aliases) ||
              r.aliases.some((a: unknown) => typeof a !== 'string'),
          )
        )
          throw new Error('Invalid registry');
        this.registry = data;
        this.refreshedAt = Date.now();
        return this.registry;
      } catch {
        this.invalidateRuntimes();
        throw new PistonUnavailableError();
      } finally {
        this.refresh = undefined;
      }
    })();
    return this.refresh;
  }

  async availableLanguages() {
    const registry = await this.runtimes();
    return ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'].map(
      (language) => {
        const version = this.config.versions[language];
        const runtime = registry.find(
          (r) =>
            canonicalLanguage(r.language) === language && r.version === version,
        );
        return { language, version: runtime?.version, enabled: !!runtime };
      },
    );
  }

  async execute(
    language: string,
    filename: string,
    code: string,
    stdin: string,
    limits: { timeLimit?: number; memoryLimit?: number } = {},
  ): Promise<PistonResponse> {
    const canonical = canonicalLanguage(language);
    if (!canonical)
      throw new BadRequestException('Unsupported execution language');
    if (
      this.closing ||
      this.openUntil > Date.now() ||
      this.active >= this.config.concurrency
    )
      throw new PistonUnavailableError();
    if (
      Buffer.byteLength(code) > 1_000_000 ||
      Buffer.byteLength(stdin) > 262144 ||
      !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(filename)
    )
      throw new BadRequestException('Execution payload exceeds allowed limits');
    const controller = new AbortController();
    this.controllers.add(controller);
    this.active++;
    const correlationId = randomUUID(),
      start = Date.now();
    try {
      const registry = await this.runtimes();
      const version = this.config.versions[canonical];
      const runtime = registry.find(
        (r) =>
          canonicalLanguage(r.language) === canonical && r.version === version,
      );
      if (!runtime)
        throw new BadRequestException('This language runtime is unavailable');
      const bounded = (value: unknown, fallback: number, minimum: number) =>
        Number.isFinite(value)
          ? Math.max(minimum, Math.min(fallback, Number(value)))
          : fallback;
      const request: PistonRequest = {
        language: runtime.language,
        version: runtime.version,
        files: [{ name: filename, content: code }],
        stdin,
        run_timeout: Math.floor(
          bounded(limits.timeLimit, this.config.runTimeout, 100),
        ),
        compile_timeout: this.config.compileTimeout,
        run_memory_limit: Math.floor(
          bounded(
            limits.memoryLimit === undefined
              ? undefined
              : limits.memoryLimit * 1048576,
            this.config.memory,
            33554432,
          ),
        ),
        compile_memory_limit: this.config.compileMemory,
      };
      this.counters.requests++;
      this.counters.languages[canonical] =
        (this.counters.languages[canonical] || 0) + 1;
      const { data } = await this.http.post<PistonResponse>(
        '/execute',
        request,
        {
          signal: controller.signal,
          headers: { 'X-Correlation-ID': correlationId },
        },
      );
      if (
        !data ||
        data.language !== runtime.language ||
        data.version !== runtime.version ||
        (!data.compile && !data.run)
      )
        throw new PistonUnavailableError();
      for (const stage of [data.compile, data.run])
        if (stage) this.validateStage(stage);
      if (!data.run && (!data.compile || data.compile.code === 0))
        throw new PistonUnavailableError();
      this.failures = 0;
      this.logger.log(
        JSON.stringify({
          event: 'piston_execution',
          correlationId,
          language: canonical,
          latencyMs: Date.now() - start,
        }),
      );
      return data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.counters.failures++;
      if (++this.failures >= 3) this.openUntil = Date.now() + 10000;
      this.logger.warn(
        JSON.stringify({
          event: 'piston_unavailable',
          correlationId,
          language: canonical,
        }),
      );
      throw new PistonUnavailableError();
    } finally {
      this.active--;
      this.controllers.delete(controller);
      this.counters.latencyMs += Date.now() - start;
    }
  }

  private validateStage(stage: PistonStage) {
    if (
      typeof stage.stdout !== 'string' ||
      typeof stage.stderr !== 'string' ||
      typeof stage.output !== 'string' ||
      !(stage.code === null || Number.isInteger(stage.code)) ||
      !(stage.signal === null || typeof stage.signal === 'string')
    )
      throw new PistonUnavailableError();
    for (const metric of [stage.cpu_time, stage.wall_time, stage.memory])
      if (metric != null && (!Number.isFinite(metric) || metric < 0))
        throw new PistonUnavailableError();
  }
  onModuleDestroy() {
    this.closing = true;
    for (const controller of this.controllers) controller.abort();
  }
}
