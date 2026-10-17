import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const incomingTraceId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
      const traceId =
        typeof incomingTraceId === 'string' && incomingTraceId.length > 0
          ? incomingTraceId.slice(0, 64)
          : randomUUID();

      req.headers['x-request-id'] = traceId;
      res.setHeader('x-request-id', traceId);

      // Passive JWT payload extraction (non-verifying, purely for log correlation)
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payloadBase64 = authHeader.split('.')[1];
          if (payloadBase64) {
            const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            userId = decoded.sub || decoded.id || decoded.userId;
          }
        } catch {
          // Ignore malformed tokens; AuthGuard handles actual security
        }
      }

      RequestContextService.run(
        {
          traceId,
          userId,
          ip: req.ip || req.socket?.remoteAddress,
          path: req.originalUrl,
          startTime: process.hrtime.bigint(),
        },
        () => next(),
      );
    } catch {
      // Fail-open: never block HTTP pipeline
      next();
    }
  }
}
