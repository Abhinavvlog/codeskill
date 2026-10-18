jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { ForbiddenException } from '@nestjs/common';
import { ExamSecurityService } from './exam-security.service';

describe('ExamSecurityService (ISSUE-SEC-001 Hardening)', () => {
  let service: ExamSecurityService;
  let assessmentRepo: any;
  let sessionRepo: any;
  let eventRepo: any;

  beforeEach(() => {
    assessmentRepo = {
      findOne: jest.fn(),
    };
    sessionRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((e) => ({ ...e, id: 'session-uuid-1' })),
      save: jest.fn().mockImplementation(async (e) => e),
    };
    eventRepo = {
      save: jest.fn(),
    };

    service = new ExamSecurityService(
      assessmentRepo as never,
      sessionRepo as never,
      eventRepo as never,
    );
  });

  it('rejects connection with ForbiddenException when assessment requires SEB but client is standard browser', async () => {
    assessmentRepo.findOne.mockResolvedValue({
      id: 'asmt-1',
      securityPolicy: {
        requireSEB: true,
      },
    });

    await expect(
      service.initSecureSession('asmt-1', 'cand-1', { isSEB: false }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects connection when assessment requires specific configKey and client provides mismatched key', async () => {
    assessmentRepo.findOne.mockResolvedValue({
      id: 'asmt-1',
      securityPolicy: {
        requireSEB: true,
        configKey: 'secret-exam-config-key-12345',
      },
    });

    await expect(
      service.initSecureSession(
        'asmt-1',
        'cand-1',
        { isSEB: true, configKey: 'wrong-key' },
        { 'user-agent': 'SafeExamBrowser/3.3.0' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('accepts genuine SEB connection and returns a cryptographically signed HMAC token (not mock string)', async () => {
    assessmentRepo.findOne.mockResolvedValue({
      id: 'asmt-1',
      durationMinutes: 60,
      securityPolicy: {
        requireSEB: true,
        configKey: 'approved-config-key',
      },
    });
    sessionRepo.findOne.mockResolvedValue(null);

    const res = await service.initSecureSession(
      'asmt-1',
      'cand-1',
      { isSEB: true, configKey: 'approved-config-key' },
      { 'user-agent': 'SafeExamBrowser/3.3.0' },
    );

    expect(res.success).toBe(true);
    expect(res.sessionId).toBe('session-uuid-1');
    expect(res.token).not.toBe('simulate-secure-token');
    // Valid SHA-256 HMAC is a 64-character hexadecimal string
    expect(res.token).toMatch(/^[a-f0-9]{64}$/);
  });
});
