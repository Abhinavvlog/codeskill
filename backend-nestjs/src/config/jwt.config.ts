import { randomBytes } from 'crypto';

/**
 * Single source of truth for JWT / session settings.
 *
 * Security rules (AUD-004 / X-01):
 *  - There is NO literal fallback secret anywhere in the code base.
 *  - Outside of explicit `development` / `test` environments a missing,
 *    short or well-known placeholder secret aborts startup.
 *  - In development/test a missing secret yields a random per-process secret
 *    (tokens simply stop working after a restart) instead of a guessable one.
 */

export const MIN_JWT_SECRET_LENGTH = 32;

/** Known placeholders that have appeared in this repository and must never be accepted. */
const FORBIDDEN_SECRETS = new Set(
  [
    'supersecretcodeskilljwt',
    'super_secret_jwt_key_here',
    'default',
    'secret',
    'changeme',
    'change-me',
    'jwt_secret',
    'your_jwt_secret',
    'your-secret-key',
    'codeskill_prod_secure_jwt_token_2026_super_secret_enterprise_key',
  ].map((s) => s.toLowerCase()),
);

export interface JwtSettings {
  secret: string;
  /** Access token lifetime in seconds. */
  accessTtlSeconds: number;
  /** Refresh token lifetime in seconds. */
  refreshTtlSeconds: number;
  issuer: string;
  audience: string;
}

export function isRelaxedEnvironment(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv === 'development' || nodeEnv === 'test';
}

/** Parses "900", "15m", "1h", "7d" into seconds. Returns undefined when invalid. */
export function parseDurationSeconds(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^(\d+)\s*([smhd]?)$/i.exec(value.trim());
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit] as number;
  const seconds = amount * factor;
  return seconds > 0 ? seconds : undefined;
}

export function validateJwtSecret(secret: string): string | null {
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    return `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`;
  }
  if (FORBIDDEN_SECRETS.has(secret.trim().toLowerCase())) {
    return 'JWT_SECRET is a known placeholder value and must be replaced';
  }
  if (new Set(secret).size < 8) {
    return 'JWT_SECRET has too little entropy';
  }
  return null;
}

let ephemeralSecret: string | undefined;

export function resolveJwtSettings(
  env: NodeJS.ProcessEnv = process.env,
): JwtSettings {
  const relaxed = isRelaxedEnvironment(env.NODE_ENV);
  let secret = env.JWT_SECRET;

  if (!secret) {
    if (!relaxed) {
      throw new Error(
        'JWT_SECRET is required. Set a random value of at least ' +
          `${MIN_JWT_SECRET_LENGTH} characters (NODE_ENV=${env.NODE_ENV ?? 'unset'}).`,
      );
    }
    ephemeralSecret ??= randomBytes(48).toString('hex');
    secret = ephemeralSecret;
  } else if (!relaxed) {
    const problem = validateJwtSecret(secret);
    if (problem) throw new Error(problem);
  }

  const accessTtlSeconds =
    parseDurationSeconds(env.JWT_ACCESS_TTL ?? env.JWT_EXPIRE) ?? 3600;
  const refreshTtlSeconds =
    parseDurationSeconds(env.JWT_REFRESH_TTL) ?? 7 * 86400;

  // Short-lived access tokens: never accept absurd lifetimes silently.
  if (!relaxed && accessTtlSeconds > 24 * 3600) {
    throw new Error(
      'JWT access token lifetime must not exceed 24h; use refresh tokens instead',
    );
  }

  return {
    secret,
    accessTtlSeconds,
    refreshTtlSeconds,
    issuer: env.JWT_ISSUER || 'codeskill',
    audience: env.JWT_AUDIENCE || 'codeskill-web',
  };
}
