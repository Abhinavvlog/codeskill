import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SystemAuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    const ip = req.ip || req.socket?.remoteAddress || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const statusCode = res.statusCode || 200;
          this.logger.log(
            `[HTTP] ${method} ${url} ${statusCode} - ${duration}ms [${ip}]`,
          );
        },
        error: (err: any) => {
          const duration = Date.now() - now;
          const status = err?.status || err?.statusCode || 500;
          this.logger.warn(
            `[HTTP FAIL] ${method} ${url} ${status} - ${duration}ms [${ip}] : ${err?.message || 'Error'}`,
          );
        },
      }),
    );
  }
}
