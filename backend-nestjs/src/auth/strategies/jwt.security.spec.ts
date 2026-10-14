jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JWT identity and active-account enforcement', () => {
  const tokenService = {
    validateAccessPayload: jest.fn(),
  };
  let strategy: JwtStrategy;
  const id = 'a1000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      {
        getOrThrow: () => ({
          secret: '01234567890123456789012345678901',
          issuer: 'codeskill',
          audience: 'codeskill-web',
        }),
      } as never,
      tokenService as never,
    );
  });

  it('delegates payload validation to tokenService.validateAccessPayload', async () => {
    const user = { id, isActive: true, role: 'student', tokenVersion: 0 };
    tokenService.validateAccessPayload.mockResolvedValue(user);

    const result = await strategy.validate({ id, tv: 0 });
    expect(result).toBe(user);
    expect(tokenService.validateAccessPayload).toHaveBeenCalledWith({ id, tv: 0 });
  });

  it('propagates unauthorized exception when tokenService rejects', async () => {
    tokenService.validateAccessPayload.mockRejectedValue(
      new UnauthorizedException('Please log in to access this resource.'),
    );

    await expect(strategy.validate({ id: 'invalid' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
