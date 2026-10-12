jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JWT identity and active-account enforcement', () => {
  const repository = { findOne: jest.fn() };
  let strategy: JwtStrategy;
  const id = 'a1000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      { get: () => 'fixture-only-jwt-secret' } as never,
      repository as never,
    );
  });

  it.each([
    undefined,
    null,
    {},
    { id: undefined },
    { id: null },
    { id: '' },
    { id: 1 },
    { id: 'invalid-id' },
  ])(
    'rejects malformed identity payload #%# before a database query',
    async (payload) => {
      await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(repository.findOne).not.toHaveBeenCalled();
    },
  );

  it('rejects a deleted account', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(strategy.validate({ id })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each([false, undefined, null])(
    'rejects a user without explicitly active status #%#',
    async (isActive) => {
      repository.findOne.mockResolvedValue({ id, isActive });
      await expect(strategy.validate({ id })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );

  it('uses the verified canonical ID and returns an active database user', async () => {
    const user = { id, isActive: true, role: 'student' };
    repository.findOne.mockResolvedValue(user);
    await expect(strategy.validate({ id, role: 'super_admin' })).resolves.toBe(
      user,
    );
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
  });
});
