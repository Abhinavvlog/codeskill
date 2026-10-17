import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as client from 'prom-client';
import { QueueEvents, Queue } from 'bullmq';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  public readonly registry = new client.Registry();
  private queueEvents?: QueueEvents;
  private submissionsQueue?: Queue;
  private queuePollInterval?: NodeJS.Timeout;

  // 1. HTTP Golden Signals
  public readonly httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests processed',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  public readonly httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  // 2. BullMQ Queue Health
  public readonly bullmqWaitingJobs = new client.Gauge({
    name: 'bullmq_queue_waiting_jobs',
    help: 'Number of waiting jobs in BullMQ',
    labelNames: ['queue'],
    registers: [this.registry],
  });

  public readonly bullmqActiveJobs = new client.Gauge({
    name: 'bullmq_queue_active_jobs',
    help: 'Number of active jobs in BullMQ',
    labelNames: ['queue'],
    registers: [this.registry],
  });

  public readonly bullmqJobDuration = new client.Histogram({
    name: 'bullmq_job_duration_seconds',
    help: 'Duration of BullMQ code execution jobs',
    labelNames: ['queue', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [this.registry],
  });

  // 3. Code Execution Verdicts (Low Cardinality)
  public readonly judgeVerdictTotal = new client.Counter({
    name: 'codeskill_judge_verdict_total',
    help: 'Total code execution verdicts by language and outcome',
    labelNames: ['language', 'verdict', 'provider'],
    registers: [this.registry],
  });

  // 4. Database & Sharding Latency
  public readonly dbQueryDuration = new client.Histogram({
    name: 'codeskill_db_query_duration_seconds',
    help: 'Database query execution duration',
    labelNames: ['target', 'operation'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [this.registry],
  });

  public readonly shardOperationsTotal = new client.Counter({
    name: 'codeskill_shard_operations_total',
    help: 'Operations routed across logical shard buckets',
    labelNames: ['bucket', 'status'],
    registers: [this.registry],
  });

  // 5. Proctoring Security Events
  public readonly proctoringViolationsTotal = new client.Counter({
    name: 'codeskill_proctoring_violations_total',
    help: 'Total proctoring security events detected',
    labelNames: ['event_type', 'severity'],
    registers: [this.registry],
  });

  // 6. Sandbox Engine (Piston & Judge0) Outbound Telemetry
  public readonly sandboxHttpDuration = new client.Histogram({
    name: 'codeskill_sandbox_http_duration_seconds',
    help: 'Outbound HTTP latency to Piston and Judge0 execution engines',
    labelNames: ['engine', 'endpoint', 'status_code'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 15],
    registers: [this.registry],
  });

  public readonly sandboxFailureTotal = new client.Counter({
    name: 'codeskill_sandbox_failure_total',
    help: 'Total network, timeout, or 5xx errors from Piston and Judge0',
    labelNames: ['engine', 'error_type'],
    registers: [this.registry],
  });

  public readonly judge0InternalQueueSize = new client.Gauge({
    name: 'codeskill_judge0_internal_queue_size',
    help: 'Number of submissions queued inside Judge0 Sidekiq/Resque workers',
    registers: [this.registry],
  });

  onModuleInit(): void {
    client.collectDefaultMetrics({
      register: this.registry,
      prefix: 'codeskill_node_',
    });
    this.initPassiveBullMqObservers();
  }

  private initPassiveBullMqObservers(): void {
    if (!process.env.REDIS_HOST && process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      const isCluster =
        process.env.REDIS_CLUSTER_MODE === 'true' ||
        process.env.REDIS_ENABLE_CLUSTER === 'true';

      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || undefined;
      const useTls = process.env.REDIS_TLS === 'true';

      const connection = isCluster && process.env.REDIS_CLUSTER_NODES
        ? undefined
        : {
            host,
            port,
            password,
            tls: useTls ? {} : undefined,
            maxRetriesPerRequest: null,
            connectTimeout: 5000,
          };

      const queueName = process.env.SUBMISSIONS_QUEUE_NAME || 'submissions';
      const queuePrefix = '{bull}';

      if (connection) {
        this.submissionsQueue = new Queue(queueName, { connection, prefix: queuePrefix });
        this.queueEvents = new QueueEvents(queueName, { connection, prefix: queuePrefix });

        this.submissionsQueue.on('error', (err) => {
          this.logger.debug(`Submissions queue error: ${err.message}`);
        });

        this.queueEvents.on('error', (err) => {
          this.logger.debug(`Submissions queue events error: ${err.message}`);
        });

        // Passively listen to job completions without modifying judge.processor.ts
        this.queueEvents.on('completed', ({ returnvalue }) => {
          try {
            const result = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;
            const language = result?.language || 'unknown';
            const verdict = result?.verdict || result?.status || 'AC';
            const provider = result?.provider || 'piston';
            this.judgeVerdictTotal.inc({ language, verdict, provider });
            this.bullmqJobDuration.observe(
              { queue: queueName, status: 'completed' },
              (result?.executionTimeMs || 500) / 1000,
            );
          } catch {
            // Ignore unparseable return values
          }
        });

        this.queueEvents.on('failed', () => {
          this.judgeVerdictTotal.inc({ language: 'unknown', verdict: 'SV_ERR', provider: 'piston' });
        });

        // Poll queue depth every 10s for Prometheus scrape
        this.queuePollInterval = setInterval(() => {
          void (async () => {
            try {
              if (!this.submissionsQueue) return;
              const counts = await this.submissionsQueue.getJobCounts('waiting', 'active');
              this.bullmqWaitingJobs.set({ queue: queueName }, counts.waiting || 0);
              this.bullmqActiveJobs.set({ queue: queueName }, counts.active || 0);
            } catch {
              // Fail-open if Redis blips
            }
          })();
        }, 10_000);
        this.queuePollInterval.unref();
      }
    } catch (err) {
      this.logger.warn(`Passive BullMQ metrics observer skipped: ${(err as Error).message}`);
    }
  }

  incrementProctoringViolation(eventType: string, severity: string): void {
    this.proctoringViolationsTotal.inc({ event_type: eventType, severity });
  }

  async getMetricsSnapshot(): Promise<string> {
    return this.registry.metrics();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queuePollInterval) clearInterval(this.queuePollInterval);
    await this.queueEvents?.close().catch(() => undefined);
    await this.submissionsQueue?.close().catch(() => undefined);
  }
}
