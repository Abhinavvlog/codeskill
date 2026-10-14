import * as bcrypt from 'bcryptjs';

/**
 * bcrypt helpers shared by the entity hook, services and CLIs (NEW-008).
 *
 * bcrypt silently ignores everything after 72 bytes, so the policy limits the
 * input to 72 bytes instead of storing a hash of a truncated secret.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/** Well-known credentials that must never be accepted as new passwords. */
const COMMON_PASSWORDS = new Set(
  [
    'admin123',
    'admin1234',
    'password',
    'password1',
    'password123',
    'password@123',
    'qwerty123',
    '12345678',
    '123456789',
    '1234567890',
    'letmein123',
    'welcome123',
    'codeskill',
    'codeskill123',
    'changeme123',
  ].map((p) => p.toLowerCase()),
);

export function isBcryptHash(value: unknown): boolean {
  return typeof value === 'string' && BCRYPT_HASH.test(value);
}

export function bcryptRounds(): number {
  const configured = Number(process.env.BCRYPT_ROUNDS);
  if (Number.isInteger(configured) && configured >= 10 && configured <= 15) {
    return configured;
  }
  // Allow a cheap cost only under the test runner.
  if (process.env.NODE_ENV === 'test' && configured >= 4 && configured < 10) {
    return configured;
  }
  return 10;
}

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('Cannot hash an empty password');
  }
  if (Buffer.byteLength(plain, 'utf8') > PASSWORD_MAX_BYTES) {
    throw new Error('Password exceeds the 72 byte bcrypt limit');
  }
  return bcrypt.hash(plain, await bcrypt.genSalt(bcryptRounds()));
}

/** Returns a human readable problem or null when the password is acceptable. */
export function validatePasswordPolicy(plain: unknown): string | null {
  if (typeof plain !== 'string') return 'Password must be a string';
  if (plain.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (Buffer.byteLength(plain, 'utf8') > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes`;
  }
  if (isBcryptHash(plain)) {
    return 'Password must not look like a password hash';
  }
  if (COMMON_PASSWORDS.has(plain.toLowerCase())) {
    return 'Password is too common';
  }
  if (new Set(plain).size < 3) {
    return 'Password is too simple';
  }
  return null;
}
