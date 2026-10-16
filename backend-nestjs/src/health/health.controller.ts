import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private isStartupComplete = false;

  constructor(
    @Optional() private readonly dataSource?: DataSource,
    @Optional() private readonly redisService?: RedisService,
  ) {
    // Once dependency injection and instantiation complete, mark startup as initialized
    this.isStartupComplete = true;
  }

  @Get()
  @ApiOperation({ summary: 'Check general API health status' })
  @ApiResponse({ status: 200, description: 'General API health status' })
  checkHealth() {
    return {
      status: 'ok',
      service: 'codeskill-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (process is running and responsive)' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  checkLiveness() {
    return {
      status: 'ok',
      probe: 'liveness',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('startup')
  @ApiOperation({ summary: 'Startup probe (initialization completed)' })
  @ApiResponse({ status: 200, description: 'Startup completed successfully' })
  checkStartup() {
    if (!this.isStartupComplete) {
      throw new ServiceUnavailableException({
        status: 'initializing',
        probe: 'startup',
        message: 'Application bootstrap is in progress',
      });
    }

    return {
      status: 'ok',
      probe: 'startup',
      initialized: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe (verifies database and Redis connectivity)' })
  @ApiResponse({ status: 200, description: 'Service is ready to handle traffic' })
  @ApiResponse({ status: 503, description: 'Service dependencies are not ready' })
  async checkReadiness() {
    const checks: Record<string, 'ok' | 'degraded' | 'failed' | 'skipped'> = {
      database: 'skipped',
      redis: 'skipped',
    };
    const errors: string[] = [];

    // 1. Check PostgreSQL Database Connectivity
    if (this.dataSource && this.dataSource.isInitialized) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout (2000ms)')), 2000),
        );
        await Promise.race([this.dataSource.query('SELECT 1'), timeoutPromise]);
        checks.database = 'ok';
      } catch (err: any) {
        checks.database = 'failed';
        errors.push(`Database error: ${err?.message || 'Connection failed'}`);
      }
    } else if (this.dataSource && !this.dataSource.isInitialized) {
      checks.database = 'failed';
      errors.push('Database dataSource is not initialized');
    }

    // 2. Check Redis Connectivity
    if (this.redisService) {
      try {
        const client = this.redisService.getClient();
        if (client) {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis ping timeout (2000ms)')), 2000),
          );
          const pong = await Promise.race([client.ping(), timeoutPromise]);
          if (pong === 'PONG' || pong) {
            checks.redis = 'ok';
          } else {
            checks.redis = 'failed';
            errors.push('Redis did not return PONG');
          }
        }
      } catch (err: any) {
        // In dev or tests Redis might be disconnected, but for readiness in production it must be monitored
        checks.redis = 'failed';
        errors.push(`Redis error: ${err?.message || 'Connection failed'}`);
      }
    }

    if (checks.database === 'failed' || checks.redis === 'failed') {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        probe: 'readiness',
        checks,
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      probe: 'readiness',
      ready: true,
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
