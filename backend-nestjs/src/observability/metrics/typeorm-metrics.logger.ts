import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import { MetricsService } from './metrics.service';
import { RequestContextService } from '../context/request-context.service';
import { PinoLogger } from 'nestjs-pino';

export class TypeOrmMetricsLogger implements TypeOrmLogger {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly pinoLogger: PinoLogger,
    private readonly targetName: 'primary' | 'shard' = 'primary',
  ) {}

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    // Fast-path: extract SQL verb (SELECT, INSERT, UPDATE, DELETE) without regex overhead
    const operation = query.trimStart().slice(0, 6).toUpperCase().split(' ')[0] || 'OTHER';
    this.metricsService.dbQueryDuration.observe({ target: this.targetName, operation }, 0.005);
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    const operation = query.trimStart().slice(0, 6).toUpperCase().split(' ')[0] || 'OTHER';
    const durationSeconds = time / 1000;

    this.metricsService.dbQueryDuration.observe({ target: this.targetName, operation }, durationSeconds);

    // Automatically ship slow queries (> 250ms) to Axiom with the active traceId
    this.pinoLogger.warn(
      {
        traceId: RequestContextService.getTraceId(),
        userId: RequestContextService.getUserId(),
        target: this.targetName,
        durationMs: time,
        operation,
        sql: query.slice(0, 500), // Truncate massive queries
      },
      'Slow PostgreSQL query detected',
    );
  }

  logQueryError(error: string | Error, query: string, parameters?: any[]): void {
    this.pinoLogger.error(
      {
        traceId: RequestContextService.getTraceId(),
        userId: RequestContextService.getUserId(),
        target: this.targetName,
        err: error instanceof Error ? error.message : error,
        sql: query.slice(0, 500),
      },
      'PostgreSQL query failed',
    );
  }

  logSchemaBuild(): void {}
  logMigration(): void {}
  log(): void {}
}
