jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';

describe('Companies Tenant Membership Authorization (NEW-004)', () => {
  let service: CompaniesService;

  const mockCompanyRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockJobRepo = {
    find: jest.fn(),
  };
  const mockCompanyUserRepo = {
    findOne: jest.fn(),
  };

  const companyId = 'company-uuid-1';
  const mockCompany = {
    id: companyId,
    name: 'Tech Corp',
    username: 'techcorp',
    isVerified: false,
    industry: 'Software',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompanyRepo.save.mockImplementation((c) => Promise.resolve(c));
    service = new CompaniesService(
      mockCompanyRepo as never,
      mockJobRepo as never,
      mockCompanyUserRepo as never,
    );
  });

  it('rejects an unauthorized user attempting to update company profile', async () => {
    mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
    mockCompanyUserRepo.findOne.mockResolvedValue(null); // No membership

    const unauthorizedActor = {
      id: 'unauthorized-user-uuid',
      role: 'student',
      isAdmin: false,
    };

    await expect(
      service.updateCompany(companyId, { industry: 'Fintech' }, unauthorizedActor),
    ).rejects.toThrow(ForbiddenException);

    expect(mockCompanyRepo.save).not.toHaveBeenCalled();
  });

  it('allows an authorized company Owner to update permitted fields, stripping protected fields', async () => {
    mockCompanyRepo.findOne.mockResolvedValue({ ...mockCompany });
    mockCompanyUserRepo.findOne.mockResolvedValue({
      id: 'membership-1',
      role: 'Owner',
      isActive: true,
    });

    const ownerActor = {
      id: 'owner-user-uuid',
      role: 'company_admin',
      isAdmin: false,
    };

    const updates = {
      industry: 'Artificial Intelligence',
      // Attacker payload trying to escalate verification and change id
      id: 'hacked-id',
      isVerified: true,
    };

    const result = await service.updateCompany(companyId, updates, ownerActor);

    expect(mockCompanyRepo.save).toHaveBeenCalled();
    const saved = mockCompanyRepo.save.mock.calls[0][0];

    expect(saved.industry).toBe('Artificial Intelligence');
    // isVerified must NOT be modified by tenant owner
    expect(saved.isVerified).toBe(false);
    expect(saved.id).toBe(companyId);
  });

  it('allows a platform super_admin to update company and verify it', async () => {
    mockCompanyRepo.findOne.mockResolvedValue({ ...mockCompany });

    const superAdminActor = {
      id: 'super-admin-uuid',
      role: 'super_admin',
      isAdmin: true,
    };

    const updates = {
      isVerified: true,
      industry: 'Enterprise Security',
    };

    await service.updateCompany(companyId, updates, superAdminActor);

    expect(mockCompanyRepo.save).toHaveBeenCalled();
    const saved = mockCompanyRepo.save.mock.calls[0][0];
    expect(saved.isVerified).toBe(true);
    expect(saved.industry).toBe('Enterprise Security');
  });
});
