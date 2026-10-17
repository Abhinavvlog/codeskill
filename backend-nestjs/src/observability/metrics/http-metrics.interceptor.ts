import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const url: string = req.originalUrl || req.url || '';

    // Skip self-scraping endpoints
    if (url.startsWith('/api/metrics') || url.startsWith('/health')) {
      return next.handle();
    }

    const startTime = process.hrtime.bigint();
    const method = req.method || 'UNKNOWN';

    return next.handle().pipe(
      tap({
        next: () => this.recordMetrics(context, method, startTime),
        error: (err) =>
          this.recordMetrics(
            context,
            method,
            startTime,
            err?.status || (typeof err?.getStatus === 'function' ? err.getStatus() : 500),
          ),
      }),
    );
  }

  private recordMetrics(
    context: ExecutionContext,
    method: string,
    startTime: bigint,
    overrideStatus?: number,
  ): void {
    try {
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();
      const statusCode = String(overrideStatus || res.statusCode || 200);

      // Prefer Express parameterized route pattern to prevent cardinality explosion
      const rawRoute: string = req.route?.path || req.baseUrl || 'unmatched';
      const normalizedRoute = rawRoute
        .replace(
          /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
          ':uuid',
        )
        .replace(/\/\d+/g, '/:id');

      const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;

      this.metricsService.httpRequestsTotal.inc({
        method,
        route: normalizedRoute,
        status_code: statusCode,
      });

      this.metricsService.httpRequestDuration.observe(
        {
          method,
          route: normalizedRoute,
          status_code: statusCode,
        },
        durationSeconds,
      );
    } catch {
      // Never impact request lifecycle
    }
  }
}
