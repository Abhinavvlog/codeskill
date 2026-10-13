jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { IsNull } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService, hashRefreshToken } from './token.service';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

describe('TokenService authentication and session security', () => {
  let service: TokenService;
  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock.access.token'),
    verifyAsync: jest.fn(),
  };
  const mockConfig = {
    getOrThrow: jest.fn().mockReturnValue({
      secret: '01234567890123456789012345678901',
      accessTtlSeconds: 900,
      refreshTtlSeconds: 604800,
      issuer: 'codeskill',
      audience: 'codeskill-web',
    }),
  };
  const mockUsers = {
    findOne: jest.fn(),
    increment: jest.fn(),
  };
  const mockRefreshTokens = {
    create: jest.fn((dto) => ({ id: 'rt-uuid-1', ...dto })),
    save: jest.fn(async (entity) => entity),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const validUserId = 'a1000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenService(
      mockJwt as never,
      mockConfig as never,
      mockUsers as never,
      mockRefreshTokens as never,
    );
  });

  describe('issueTokens', () => {
    it('issues access token and saves SHA-256 hashed refresh token', async () => {
      const user = { id: validUserId, tokenVersion: 2 };
      const tokens = await service.issueTokens(user);

      expect(tokens.token).toBe('mock.access.token');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.refreshToken.length).toBeGreaterThan(20);
      expect(mockRefreshTokens.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: validUserId,
          tokenHash: hashRefreshToken(tokens.refreshToken),
        }),
      );
    });
  });

  describe('validateAccessPayload', () => {
    it('rejects invalid or non-UUID user id', async () => {
      await expect(service.validateAccessPayload({ id: 'bad-id', tv: 0 })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(mockUsers.findOne).not.toHaveBeenCalled();
    });

    it('rejects non-existent or inactive user', async () => {
      mockUsers.findOne.mockResolvedValue(null);
      await expect(service.validateAccessPayload({ id: validUserId, tv: 0 })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      mockUsers.findOne.mockResolvedValue({ id: validUserId, isActive: false, tokenVersion: 0 });
      await expect(service.validateAccessPayload({ id: validUserId, tv: 0 })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects outdated tokenVersion (revoked token)', async () => {
      mockUsers.findOne.mockResolvedValue({ id: validUserId, isActive: true, tokenVersion: 2 });
      await expect(service.validateAccessPayload({ id: validUserId, tv: 1 })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('accepts matching tokenVersion for active user', async () => {
      const user = { id: validUserId, isActive: true, tokenVersion: 2 };
      mockUsers.findOne.mockResolvedValue(user);
      const result = await service.validateAccessPayload({ id: validUserId, tv: 2 });
      expect(result).toBe(user);
    });
  });

  describe('rotate (refresh token rotation & reuse detection)', () => {
    it('rotates a valid refresh token atomically', async () => {
      const raw = 'valid-refresh-token-1234567890';
      const existing = {
        id: 'rt-1',
        userId: validUserId,
        familyId: 'family-1',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
      };
      mockRefreshTokens.findOne
        .mockResolvedValueOnce(existing) // lookup by hash
        .mockResolvedValueOnce(null); // lookup successor
      mockRefreshTokens.update.mockResolvedValue({ affected: 1 });
      mockUsers.findOne.mockResolvedValue({ id: validUserId, isActive: true, tokenVersion: 0 });

      const res = await service.rotate(raw);
      expect(res.token).toBe('mock.access.token');
      expect(res.refreshToken).toBeDefined();
      expect(mockRefreshTokens.update).toHaveBeenCalledWith(
        { id: 'rt-1', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });

    it('detects reuse and revokes entire family when an already revoked token is used', async () => {
      const raw = 'reused-refresh-token-1234567890';
      const alreadyRevoked = {
        id: 'rt-1',
        userId: validUserId,
        familyId: 'family-compromised',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 60000), // revoked 1 min ago (> grace period)
      };
      mockRefreshTokens.findOne.mockResolvedValueOnce(alreadyRevoked);
      mockRefreshTokens.update.mockResolvedValue({ affected: 0 }); // update failed because revokedAt wasn't null

      await expect(service.rotate(raw)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockRefreshTokens.update).toHaveBeenCalledWith(
        { familyId: 'family-compromised', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe('invalidateUserSessions', () => {
    it('increments tokenVersion and revokes all active refresh tokens for the user', async () => {
      await service.invalidateUserSessions(validUserId);
      expect(mockUsers.increment).toHaveBeenCalledWith(
        { id: validUserId },
        'tokenVersion',
        1,
      );
      expect(mockRefreshTokens.update).toHaveBeenCalledWith(
        { userId: validUserId, revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});
