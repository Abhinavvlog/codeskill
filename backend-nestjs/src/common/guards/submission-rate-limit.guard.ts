import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class SubmissionRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(SubmissionRateLimitGuard.name);
  private readonly maxPerMinute: number;
  private readonly maxConcurrent: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.maxPerMinute =
      this.configService.get<number>('runner.rateLimitPerMin') ||
      parseInt(process.env.SUBMISSION_RATE_LIMIT_PER_MINUTE || '15', 10);
    this.maxConcurrent =
      this.configService.get<number>('runner.maxConcurrentPerUser') ||
      parseInt(process.env.MAX_CONCURRENT_JOBS_PER_USER || '2', 10);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') return true;
    const userId = request.user?._id || request.user?.id || 'anonymous';
    const clientIp =
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.socket?.remoteAddress ||
      'unknown-ip';

    const client = this.redisService.getClient();
    if (!client) {
      if (process.env.CODE_EXECUTION_PROVIDER === 'piston')
        throw new HttpException(
          'Execution rate limiting is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      return true; // Legacy compatibility
    }

    const now = Date.now();
    const windowSec = 60;
    const rateLimitKey = `ratelimit:submissions:${userId !== 'anonymous' ? userId : clientIp}`;
    const activeJobsKey = `active:submissions:${userId}`;

    try {
      // 1. Check concurrent active executions for user
      if (userId !== 'anonymous') {
        const activeCount = Math.max(
          0,
          parseInt((await client.get(activeJobsKey)) || '0', 10),
        );
        if (activeCount >= this.maxConcurrent) {
          throw new HttpException(
            {
              success: false,
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              error: 'Too Many Requests',
              message: `You have ${activeCount} active code execution(s) in progress. Please wait for them to finish.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // 2. Sliding window rate limiting
      const currentCount = Number(
        await client.eval(
          `
        redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
        local count = redis.call('ZCARD', KEYS[1])
        if count >= tonumber(ARGV[4]) then return count end
        redis.call('ZADD', KEYS[1], ARGV[1], ARGV[3])
        redis.call('EXPIRE', KEYS[1], 60)
        return count
      `,
          1,
          rateLimitKey,
          now,
          windowSec * 1000,
          `${now}-${Math.random()}`,
          this.maxPerMinute,
        ),
      );

      if (currentCount >= this.maxPerMinute) {
        throw new HttpException(
          {
            success: false,
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Maximum ${this.maxPerMinute} submissions per minute allowed. Please try again shortly.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Rate limiter check error: ${err.message}`);
      if (process.env.CODE_EXECUTION_PROVIDER === 'piston')
        throw new HttpException(
          'Execution rate limiting is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      return true; // Legacy compatibility
    }
  }
}
