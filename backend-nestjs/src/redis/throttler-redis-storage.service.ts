import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;


interface MemoryThrottleRecord {
  totalHits: number;
  expiresAt: number;
  isBlocked: boolean;
  blockExpiresAt: number;
}

const LUA_THROTTLE_INCREMENT = `
local key = KEYS[1]
local ttl_ms = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local block_duration_ms = tonumber(ARGV[3])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('PEXPIRE', key, ttl_ms)
end
local pttl = redis.call('PTTL', key)
if pttl < 0 then
    redis.call('PEXPIRE', key, ttl_ms)
    pttl = ttl_ms
end

local is_blocked = 0
local time_to_block_expire = 0

if current > limit then
    is_blocked = 1
    local block_key = key .. ':blocked'
    local block_pttl = redis.call('PTTL', block_key)
    if block_pttl <= 0 then
        redis.call('SET', block_key, '1', 'PX', block_duration_ms)
        block_pttl = block_duration_ms
    end
    time_to_block_expire = math.ceil(block_pttl / 1000)
end

local time_to_expire = math.ceil(pttl / 1000)
return { current, time_to_expire, is_blocked, time_to_block_expire }
`;

/**
 * ThrottlerRedisStorageService
 *
 * Distributed Redis rate limiting storage with fail-open in-memory resilience.
 *
 * Synchronizes rate limit counters across all multi-process PM2 workers
 * and container replicas. If Redis is unavailable or times out, it gracefully
 * falls back to local in-memory counters so students are never blocked
 * during examinations.
 */
@Injectable()
export class ThrottlerRedisStorageService implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerRedisStorageService.name);
  private readonly memory = new Map<string, MemoryThrottleRecord>();

  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const fullKey = `{throttle}:${throttlerName}:${key}`;
    const blockDurationMs = blockDuration > 0 ? blockDuration : ttl;

    try {
      const client = this.redisService.getClient();
      // Ensure Redis is ready before sending command
      if (client.status === 'ready') {
        const result = (await client.eval(
          LUA_THROTTLE_INCREMENT,
          1,
          fullKey,
          ttl.toString(),
          limit.toString(),
          blockDurationMs.toString(),
        )) as [number, number, number, number];

        return {
          totalHits: Number(result[0]),
          timeToExpire: Number(result[1]),
          isBlocked: Number(result[2]) === 1,
          timeToBlockExpire: Number(result[3]),
        };
      }
    } catch (error) {
      this.logger.warn(
        `Redis throttler storage error, falling back to in-memory: ${(error as Error).message}`,
      );
    }

    // Fail-open fallback: in-memory counter
    return this.memoryIncrement(fullKey, ttl, limit, blockDurationMs);
  }

  private memoryIncrement(
    key: string,
    ttlMs: number,
    limit: number,
    blockDurationMs: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();

    // Prevent memory leaks under extreme traffic
    if (this.memory.size > 10_000) {
      for (const [k, v] of this.memory) {
        if (v.expiresAt <= now && v.blockExpiresAt <= now) {
          this.memory.delete(k);
        }
      }
      if (this.memory.size > 10_000) {
        this.memory.clear();
      }
    }

    let record = this.memory.get(key);
    if (!record || record.expiresAt <= now) {
      record = {
        totalHits: 0,
        expiresAt: now + ttlMs,
        isBlocked: false,
        blockExpiresAt: 0,
      };
      this.memory.set(key, record);
    }

    record.totalHits += 1;

    if (record.totalHits > limit && !record.isBlocked) {
      record.isBlocked = true;
      record.blockExpiresAt = now + blockDurationMs;
    }

    const timeToExpire = Math.max(0, Math.ceil((record.expiresAt - now) / 1000));
    const timeToBlockExpire = record.isBlocked
      ? Math.max(0, Math.ceil((record.blockExpiresAt - now) / 1000))
      : 0;

    if (timeToBlockExpire === 0 && record.isBlocked) {
      record.isBlocked = false;
    }

    return {
      totalHits: record.totalHits,
      timeToExpire,
      isBlocked: record.isBlocked,
      timeToBlockExpire,
    };
  }
}
