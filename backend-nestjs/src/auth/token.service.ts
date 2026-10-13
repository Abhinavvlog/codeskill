import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { isUUID } from 'class-validator';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { JwtSettings } from '../config/jwt.config';

export interface AccessTokenPayload {
  id: string;
  /** User.tokenVersion at issuance time. */
  tv: number;
}

export interface IssuedTokens {
  token: string;
  refreshToken: string;
  /** Access token lifetime, seconds. */
  expiresIn: number;
}

/** Two near-simultaneous refreshes (e.g. two tabs) are not treated as theft. */
const REFRESH_REUSE_GRACE_MS = 10_000;

const UNAUTHENTICATED = 'Please log in to access this resource.';

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly settings: JwtSettings;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {
    this.settings = config.getOrThrow<JwtSettings>('jwt');
  }

  get accessTtlSeconds(): number {
    return this.settings.accessTtlSeconds;
  }

  signAccessToken(user: Pick<User, 'id' | 'tokenVersion'>): string {
    const payload: AccessTokenPayload = {
      id: user.id,
      tv: Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0,
    };
    return this.jwt.sign(payload, {
      secret: this.settings.secret,
      algorithm: 'HS256',
      expiresIn: this.settings.accessTtlSeconds,
      issuer: this.settings.issuer,
      audience: this.settings.audience,
    });
  }

  /** Issue an access token plus a brand-new refresh-token family. */
  async issueTokens(
    user: Pick<User, 'id' | 'tokenVersion'>,
    familyId: string = randomUUID(),
  ): Promise<IssuedTokens> {
    const raw = randomBytes(48).toString('base64url');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: hashRefreshToken(raw),
        familyId,
        expiresAt: new Date(Date.now() + this.settings.refreshTtlSeconds * 1000),
        revokedAt: null,
        replacedById: null,
      }),
    );
    return {
      token: this.signAccessToken(user),
      refreshToken: raw,
      expiresIn: this.settings.accessTtlSeconds,
    };
  }

  /**
   * Verifies an access token (signature, algorithm, issuer, audience, expiry)
   * and the live account state. Used by the WebSocket gateway; the HTTP path
   * performs the same checks through JwtStrategy.
   */
  async authenticateAccessToken(token: unknown): Promise<User> {
    if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }
    let payload: Partial<AccessTokenPayload>;
    try {
      payload = await this.jwt.verifyAsync<Partial<AccessTokenPayload>>(token, {
        secret: this.settings.secret,
        algorithms: ['HS256'],
        issuer: this.settings.issuer,
        audience: this.settings.audience,
      });
    } catch {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }
    return this.validateAccessPayload(payload);
  }

  /** Shared account-state check for a verified payload. */
  async validateAccessPayload(
    payload: Partial<AccessTokenPayload> | null | undefined,
  ): Promise<User> {
    if (!payload || typeof payload.id !== 'string' || !isUUID(payload.id)) {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }
    const user = await this.users.findOne({ where: { id: payload.id } });
    if (!user || user.isActive !== true) {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }
    // Tokens minted before tokenVersion existed carry no `tv` and count as 0.
    const claimed = Number.isInteger(payload.tv) ? (payload.tv as number) : 0;
    if (claimed !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }
    return user;
  }

  /** Rotate a refresh token: consume it exactly once and issue a successor. */
  async rotate(rawToken: unknown): Promise<IssuedTokens & { user: User }> {
    if (typeof rawToken !== 'string' || rawToken.length < 20 || rawToken.length > 256) {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }
    const row = await this.refreshTokens.findOne({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
    if (!row) throw new UnauthorizedException(UNAUTHENTICATED);

    if (row.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(UNAUTHENTICATED);
    }

    // Atomic single-use consumption: only one caller can flip revokedAt.
    const consumed = await this.refreshTokens.update(
      { id: row.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (consumed.affected !== 1) {
      const revokedAgo = row.revokedAt
        ? Date.now() - row.revokedAt.getTime()
        : Number.POSITIVE_INFINITY;
      if (revokedAgo > REFRESH_REUSE_GRACE_MS) {
        this.logger.warn(
          `Refresh token reuse detected; revoking token family ${row.familyId}`,
        );
        await this.refreshTokens.update(
          { familyId: row.familyId, revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
      }
      throw new UnauthorizedException(UNAUTHENTICATED);
    }

    const user = await this.users.findOne({ where: { id: row.userId } });
    if (!user || user.isActive !== true) {
      await this.revokeFamily(row.familyId);
      throw new UnauthorizedException(UNAUTHENTICATED);
    }

    const next = await this.issueTokens(user, row.familyId);
    const successor = await this.refreshTokens.findOne({
      where: { tokenHash: hashRefreshToken(next.refreshToken) },
    });
    if (successor) {
      await this.refreshTokens.update({ id: row.id }, { replacedById: successor.id });
    }
    return { ...next, user };
  }

  /** Revoke the family of the presented refresh token (logout). Idempotent. */
  async revokeRefreshToken(rawToken: unknown): Promise<void> {
    if (typeof rawToken !== 'string' || !rawToken) return;
    const row = await this.refreshTokens.findOne({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
    if (row) await this.revokeFamily(row.familyId);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokens.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Invalidate every session of a user: bumps tokenVersion (kills all access
   * tokens) and revokes all refresh tokens. Call after a role change,
   * password change/reset, deactivation or explicit "log out everywhere".
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    await this.users.increment({ id: userId }, 'tokenVersion', 1);
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /** Housekeeping helper (also exercised by tests). */
  async countActiveRefreshTokens(userId: string): Promise<number> {
    return this.refreshTokens.count({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
    });
  }
}
