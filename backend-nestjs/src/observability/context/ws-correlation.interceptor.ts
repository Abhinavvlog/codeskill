import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class WsCorrelationInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'ws') {
      return next.handle();
    }

    try {
      const client = context.switchToWs().getClient();
      const pattern = context.switchToWs().getPattern();
      const traceId =
        client?.handshake?.headers?.['x-request-id'] ||
        client?.id ||
        randomUUID();
      const userId = client?.user?.id || client?.data?.userId;

      // Passively count proctoring violation events without editing Gateway code
      if (typeof pattern === 'string' && pattern.includes('violation')) {
        const data = context.switchToWs().getData();
        this.metricsService.incrementProctoringViolation(
          data?.eventType || pattern,
          data?.severity || 'warning',
        );
      }

      return new Observable((subscriber) => {
        RequestContextService.run(
          {
            traceId,
            userId,
            startTime: process.hrtime.bigint(),
          },
          () => {
            next.handle().subscribe(subscriber);
          },
        );
      });
    } catch {
      return next.handle();
    }
  }
}
