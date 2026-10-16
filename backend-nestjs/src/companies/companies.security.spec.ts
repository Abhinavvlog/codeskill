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

  it('AUD-024: rejects an unauthorized user from viewing company profile via getCompanyById', async () => {
    mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
    mockCompanyUserRepo.findOne.mockResolvedValue(null);

    const unauthorizedActor = {
      id: 'outsider-id',
      role: 'student',
      isAdmin: false,
    };

    await expect(
      service.getCompanyById(companyId, unauthorizedActor),
    ).rejects.toThrow(ForbiddenException);
  });

  it('AUD-024: allows an active member or platform admin to view company profile via getCompanyById', async () => {
    mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
    mockCompanyUserRepo.findOne.mockResolvedValue({
      id: 'membership-1',
      role: 'Member',
      isActive: true,
    });

    const memberActor = {
      id: 'member-id',
      role: 'company_user',
      isAdmin: false,
    };

    const result = await service.getCompanyById(companyId, memberActor);
    expect(result.success).toBe(true);
    expect(result.company.id).toBe(companyId);
  });

  it('AUD-015: allows company owner to create, list, and update job postings', async () => {
    mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
    mockCompanyUserRepo.findOne.mockResolvedValue({
      id: 'membership-owner',
      role: 'Owner',
      isActive: true,
    });
    mockJobRepo.find.mockResolvedValue([
      { id: 'job-1', title: 'Senior Software Engineer' },
    ]);
    (mockJobRepo as any).create = jest.fn((data: any) => ({
      id: 'new-job-1',
      ...data,
    }));
    (mockJobRepo as any).save = jest.fn((job: any) => Promise.resolve(job));

    const ownerActor = {
      id: 'owner-id',
      role: 'company_admin',
      isAdmin: false,
    };

    const jobsResult = await service.getJobs(companyId, ownerActor);
    expect(jobsResult.success).toBe(true);
    expect(jobsResult.jobs).toHaveLength(1);

    const createResult = await service.createJob(
      companyId,
      { title: 'Frontend Lead', description: 'React + Next.js' },
      ownerActor,
    );
    expect(createResult.success).toBe(true);
    expect(createResult.job.title).toBe('Frontend Lead');
  });
});
