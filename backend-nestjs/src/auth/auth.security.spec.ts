jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
jest.mock('../redis/otp.service', () => ({ OtpService: class {} }));

import { UnauthorizedException } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';

const correctPassword = 'fixture-only-admin-credential';

describe('Admin password authentication security', () => {
  let admin: User;
  let hash: string;
  let service: AuthService;
  const repository = { findOne: jest.fn(), save: jest.fn() };
  const otp = { verifyOTP: jest.fn() };

  beforeAll(async () => {
    hash = await bcrypt.hash(correctPassword, 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    admin = Object.assign(new User(), {
      id: 'a1000000-0000-4000-8000-000000000001',
      email: 'admin@example.test',
      name: 'Fixture Admin',
      password: hash,
      role: 'admin',
      isAdmin: true,
      isActive: true,
    });
    admin.getSignedJwtToken = jest.fn(() => 'fixture-only-token');
    repository.findOne.mockResolvedValue(admin);
    repository.save.mockImplementation(async (user: User) => user);
    otp.verifyOTP.mockResolvedValue(true);
    service = new AuthService(
      repository as never,
      otp as never,
      { get: jest.fn() } as never,
    );
  });

  it('authenticates an active admin with the correct password', async () => {
    const result = await service.adminLogin({
      email: admin.email,
      password: correctPassword,
    });
    expect(result.token).toBe('fixture-only-token');
    expect(result.user.id).toBe(admin.id);
    expect(result.user).not.toHaveProperty('password');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ isActive: true }),
      }),
    );
  });

  it.each([undefined, null, ''])(
    'rejects an admin without a stored password #%#',
    async (missing) => {
      admin.password = missing as string;
      await expect(
        service.adminLogin({ email: admin.email, password: correctPassword }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(admin.getSignedJwtToken).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, ''])(
    'rejects missing password input at the service boundary #%#',
    async (missing) => {
      await expect(
        service.adminLogin({ email: admin.email, password: missing as string }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(admin.getSignedJwtToken).not.toHaveBeenCalled();
    },
  );

  it('rejects a wrong password', async () => {
    await expect(
      service.adminLogin({
        email: admin.email,
        password: 'fixture-only-wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(admin.getSignedJwtToken).not.toHaveBeenCalled();
  });

  it('rejects a deactivated admin even when the password is correct', async () => {
    admin.isActive = false;
    await expect(
      service.adminLogin({ email: admin.email, password: correctPassword }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(admin.getSignedJwtToken).not.toHaveBeenCalled();
  });

  it('rejects a non-admin even when its password is correct', async () => {
    admin.isAdmin = false;
    await expect(
      service.adminLogin({ email: admin.email, password: correctPassword }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(admin.getSignedJwtToken).not.toHaveBeenCalled();
  });

  it('rejects an unknown account', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.adminLogin({ email: admin.email, password: correctPassword }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects deactivated admins after OTP verification as well', async () => {
    admin.isActive = false;
    await expect(
      service.adminVerifyOtp({ email: admin.email, otp: 'fixture-code' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(admin.getSignedJwtToken).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('retains valid active-admin OTP authentication', async () => {
    const result = await service.adminVerifyOtp({
      email: admin.email,
      otp: 'fixture-code',
    });
    expect(result.token).toBe('fixture-only-token');
    expect(otp.verifyOTP).toHaveBeenCalled();
  });
});

describe('Admin password login request validation', () => {
  it.each([undefined, null, '', 123, {}])(
    'rejects absent or invalid passwords #%#',
    (password) => {
      const dto = plainToInstance(AdminLoginDto, {
        email: 'admin@example.test',
        password,
      });
      expect(
        validateSync(dto).some((error) => error.property === 'password'),
      ).toBe(true);
    },
  );

  it('accepts a populated string password', () => {
    const dto = plainToInstance(AdminLoginDto, {
      email: 'admin@example.test',
      password: correctPassword,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });
});
