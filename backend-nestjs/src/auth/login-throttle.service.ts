import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';

export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const LOGIN_MAX_FAILURES_PER_ACCOUNT = 10;
export const LOGIN_MAX_FAILURES_PER_IP = 60;

interface MemoryEntry {
  count: number;
  resetAt: number;
}

/**
 * Brute-force protection for password logins.
 *
 * Redis is the shared store. If Redis is unavailable the limiter degrades to a
 * per-process in-memory counter rather than turning off (never fully open),
 * while still allowing legitimate logins so a cache outage does not lock every
 * student out of an examination.
 */
@Injectable()
export class LoginThrottleService {
  private readonly logger = new Logger(LoginThrottleService.name);
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(private readonly redisService: RedisService) {}

  private accountKey(identifier: string): string {
    const digest = createHash('sha256')
      .update(identifier.trim().toLowerCase())
      .digest('hex')
      .slice(0, 32);
    return `login:fail:acct:${digest}`;
  }

  private ipKey(ip: string | undefined): string {
    return `login:fail:ip:${ip || 'unknown'}`;
  }

  private memoryCount(key: string): number {
    const entry = this.memory.get(key);
    if (!entry) return 0;
    if (entry.resetAt <= Date.now()) {
      this.memory.delete(key);
      return 0;
    }
    return entry.count;
  }

  private memoryBump(key: string): void {
    if (this.memory.size > 10_000) {
      const now = Date.now();
      for (const [k, v] of this.memory) if (v.resetAt <= now) this.memory.delete(k);
      if (this.memory.size > 10_000) this.memory.clear();
    }
    const entry = this.memory.get(key);
    if (!entry || entry.resetAt <= Date.now()) {
      this.memory.set(key, {
        count: 1,
        resetAt: Date.now() + LOGIN_WINDOW_SECONDS * 1000,
      });
    } else {
      entry.count += 1;
    }
  }

  private async count(key: string): Promise<number> {
    const local = this.memoryCount(key);
    try {
      const value = await this.redisService.getClient().get(key);
      return Math.max(local, Number(value) || 0);
    } catch (error) {
      this.logger.warn(
        `Login throttle store unavailable, using in-memory counters: ${(error as Error).message}`,
      );
      return local;
    }
  }

  private async bump(key: string): Promise<void> {
    this.memoryBump(key);
    try {
      const client = this.redisService.getClient();
      const results = await client
        .multi()
        .incr(key)
        .expire(key, LOGIN_WINDOW_SECONDS)
        .exec();
      if (!results || results.some(([err]) => err)) {
        throw new Error('throttle write failed');
      }
    } catch (error) {
      this.logger.warn(
        `Login throttle write failed, in-memory counter retained: ${(error as Error).message}`,
      );
    }
  }

  /** Throws 429 when the account or the source address is locked out. */
  async assertAllowed(identifier: string, ip?: string): Promise<void> {
    const [account, source] = await Promise.all([
      this.count(this.accountKey(identifier)),
      this.count(this.ipKey(ip)),
    ]);
    if (
      account >= LOGIN_MAX_FAILURES_PER_ACCOUNT ||
      source >= LOGIN_MAX_FAILURES_PER_IP
    ) {
      throw new HttpException(
        'Too many failed sign-in attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailure(identifier: string, ip?: string): Promise<void> {
    await Promise.all([
      this.bump(this.accountKey(identifier)),
      this.bump(this.ipKey(ip)),
    ]);
  }

  async recordSuccess(identifier: string): Promise<void> {
    const key = this.accountKey(identifier);
    this.memory.delete(key);
    try {
      await this.redisService.getClient().del(key);
    } catch {
      // best effort
    }
  }
}
