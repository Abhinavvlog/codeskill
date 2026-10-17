import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextService } from './context/request-context.service';
import { CorrelationMiddleware } from './context/correlation.middleware';
import { WsCorrelationInterceptor } from './context/ws-correlation.interceptor';
import { StructuredLoggerModule } from './logger/logger.module';
import { MetricsService } from './metrics/metrics.service';
import { HttpMetricsInterceptor } from './metrics/http-metrics.interceptor';
import { MetricsController } from './metrics/metrics.controller';
import { HealthAndTelemetryController } from './health/health.controller';
import { TypeOrmMetricsLogger } from './metrics/typeorm-metrics.logger';
import { DataSource } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { SandboxTelemetryService } from './metrics/sandbox-telemetry.service';

@Global()
@Module({
  imports: [StructuredLoggerModule],
  controllers: [MetricsController, HealthAndTelemetryController],
  providers: [
    RequestContextService,
    MetricsService,
    SandboxTelemetryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: WsCorrelationInterceptor,
    },
  ],
  exports: [
    RequestContextService,
    MetricsService,
    SandboxTelemetryService,
    StructuredLoggerModule,
  ],
})
export class ObservabilityModule implements NestModule, OnModuleInit {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly pinoLogger: PinoLogger,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }

  onModuleInit(): void {
    // 1. Dynamic non-intrusive TypeORM logger binding
    if (this.dataSource && typeof this.dataSource.setOptions === 'function') {
      try {
        const typeormLogger = new TypeOrmMetricsLogger(
          this.metricsService,
          this.pinoLogger,
          'primary',
        );
        this.dataSource.setOptions({
          logger: typeormLogger,
          maxQueryExecutionTime: 250,
        });
      } catch {
        // Fail-open
      }
    }

    // 2. Zero-touch console error hijacking in production
    if (process.env.NODE_ENV === 'production') {
      const origError = console.error.bind(console);
      console.error = (...args: any[]) => {
        const traceId = RequestContextService.getTraceId();
        origError(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            traceId,
            userId: RequestContextService.getUserId(),
            message: args
              .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
              .join(' '),
          }),
        );
      };
    }
  }
}
