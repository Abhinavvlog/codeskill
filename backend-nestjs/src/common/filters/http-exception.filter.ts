import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = HttpStatus[status] || 'REQUEST_ERROR';
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          details = resObj.message;
          message = resObj.message.join('; ');
        } else if (resObj.message) {
          message = String(resObj.message);
        } else if (resObj.error) {
          message = String(resObj.error);
        }
        if (resObj.error && typeof resObj.error === 'string') {
          code = resObj.error.replace(/\s+/g, '_').toUpperCase();
        }
      }
    } else if (exception && typeof exception === 'object') {
      const err = exception as any;
      const errName = err.name || err.constructor?.name || '';

      // TypeORM Query / Postgres constraint violations
      if (errName === 'QueryFailedError' || err.code === '23505') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_RESOURCE';
        message = err.detail || 'A record with this value already exists in the system.';
      } else if (err.code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        code = 'FOREIGN_KEY_VIOLATION';
        message = err.detail || 'Referenced record does not exist or cannot be modified.';
      } else if (errName === 'EntityNotFoundError') {
        status = HttpStatus.NOT_FOUND;
        code = 'ENTITY_NOT_FOUND';
        message = 'The requested resource was not found in the database.';
      } else if (err instanceof Error) {
        message = err.message || 'An unexpected application error occurred.';
        code = 'RUNTIME_ERROR';
      }
    }

    const timestamp = new Date().toISOString();
    const path = request?.url || '';
    const method = request?.method || '';
    const ip = request?.ip || request?.socket?.remoteAddress || '';

    // System-wide structured error logging
    if (status >= 500) {
      this.logger.error(
        `[${method}] ${path} - Status: ${status} [${code}] - IP: ${ip} - Message: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${method}] ${path} - Status: ${status} [${code}] - IP: ${ip} - Message: ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      path,
      method,
      timestamp,
    });
  }
}
