import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let mockDataSource: Partial<DataSource>;
  let mockRedisService: Partial<RedisService>;

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue('PONG'),
      } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockDataSource },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return general health status', () => {
      const result = controller.checkHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('codeskill-backend');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkLiveness', () => {
    it('should return 200 liveness without checking database', () => {
      const result = controller.checkLiveness();
      expect(result.status).toBe('ok');
      expect(result.probe).toBe('liveness');
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('checkStartup', () => {
    it('should return 200 when startup is initialized', () => {
      const result = controller.checkStartup();
      expect(result.status).toBe('ok');
      expect(result.initialized).toBe(true);
    });
  });

  describe('checkReadiness', () => {
    it('should return 200 when both DB and Redis are healthy', async () => {
      const result = await controller.checkReadiness();
      expect(result.status).toBe('ok');
      expect(result.ready).toBe(true);
      expect(result.checks.database).toBe('ok');
      expect(result.checks.redis).toBe('ok');
    });

    it('should throw ServiceUnavailableException if DB query fails', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValueOnce(new Error('Connection lost'));
      await expect(controller.checkReadiness()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException if Redis ping fails', async () => {
      mockRedisService.getClient = jest.fn().mockReturnValue({
        ping: jest.fn().mockRejectedValueOnce(new Error('Redis offline')),
      } as any);

      await expect(controller.checkReadiness()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
