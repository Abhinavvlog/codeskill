import { ThrottlerRedisStorageService } from './throttler-redis-storage.service';
import { RedisService } from './redis.service';

describe('ThrottlerRedisStorageService', () => {
  let service: ThrottlerRedisStorageService;
  let mockRedisService: RedisService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      status: 'ready',
      eval: jest.fn(),
    };

    mockRedisService = {
      getClient: jest.fn(() => mockClient),
    } as unknown as RedisService;

    service = new ThrottlerRedisStorageService(mockRedisService);
  });

  describe('increment with active Redis', () => {
    it('evaluates Redis Lua script and returns parsed storage record', async () => {
      // Returns [totalHits, timeToExpire, isBlocked (0 or 1), timeToBlockExpire]
      mockClient.eval.mockResolvedValue([5, 58, 0, 0]);

      const record = await service.increment('test-key', 60000, 100, 60000, 'default');

      expect(mockClient.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        '{throttle}:default:test-key',
        '60000',
        '100',
        '60000',
      );

      expect(record).toEqual({
        totalHits: 5,
        timeToExpire: 58,
        isBlocked: false,
        timeToBlockExpire: 0,
      });
    });

    it('returns isBlocked: true when totalHits exceeds limit', async () => {
      mockClient.eval.mockResolvedValue([101, 55, 1, 55]);

      const record = await service.increment('test-key', 60000, 100, 60000, 'default');

      expect(record).toEqual({
        totalHits: 101,
        timeToExpire: 55,
        isBlocked: true,
        timeToBlockExpire: 55,
      });
    });
  });

  describe('increment with Redis failure (Fail-Open in-memory fallback)', () => {
    it('falls back to in-memory counters when Redis is disconnected', async () => {
      mockClient.status = 'reconnecting'; // not ready

      const r1 = await service.increment('mem-key', 1000, 2, 1000, 'short');
      expect(r1.totalHits).toBe(1);
      expect(r1.isBlocked).toBe(false);

      const r2 = await service.increment('mem-key', 1000, 2, 1000, 'short');
      expect(r2.totalHits).toBe(2);
      expect(r2.isBlocked).toBe(false);

      const r3 = await service.increment('mem-key', 1000, 2, 1000, 'short');
      expect(r3.totalHits).toBe(3);
      expect(r3.isBlocked).toBe(true);
      expect(r3.timeToBlockExpire).toBeGreaterThan(0);
    });

    it('falls back to in-memory counters when Redis eval throws error', async () => {
      mockClient.status = 'ready';
      mockClient.eval.mockRejectedValue(new Error('Redis connection timeout'));

      const r1 = await service.increment('err-key', 60000, 10, 60000, 'default');
      expect(r1.totalHits).toBe(1);
      expect(r1.isBlocked).toBe(false);
    });
  });
});
