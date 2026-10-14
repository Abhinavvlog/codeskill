import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

// Regression fixtures for removed development bypasses; never credential seeds.
const formerlyAcceptedFallbacks = [
  '12345678',
  'password123',
  'student123',
  'admin123',
];

describe('User password verification security', () => {
  let user: User;
  const correctPassword = 'fixture-only-correct-credential';

  beforeAll(async () => {
    user = new User();
    user.password = await bcrypt.hash(correctPassword, 4);
  });

  it('accepts the actual password matching the stored bcrypt hash', async () => {
    await expect(user.matchPassword(correctPassword)).resolves.toBe(true);
  });

  it.each(formerlyAcceptedFallbacks)(
    'rejects a formerly accepted fallback candidate #%# against an unrelated hash',
    async (candidate) => {
      await expect(user.matchPassword(candidate)).resolves.toBe(false);
    },
  );

  it('rejects an ordinary wrong password', async () => {
    await expect(
      user.matchPassword('fixture-only-wrong-credential'),
    ).resolves.toBe(false);
  });

  it('rejects users without a stored password', async () => {
    await expect(new User().matchPassword(correctPassword)).resolves.toBe(
      false,
    );
  });

  it.each([undefined, null, 123, '', {}])(
    'rejects missing or non-string credential input #%# without throwing',
    async (candidate) => {
      await expect(user.matchPassword(candidate as string)).resolves.toBe(
        false,
      );
    },
  );
});
