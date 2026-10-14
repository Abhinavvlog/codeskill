jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CampusService } from './campus.service';

describe('Campus Tenant Membership Authorization (NEW-004)', () => {
  let service: CampusService;

  const mockUniversityRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockUniversityUserRepo = {
    findOne: jest.fn(),
  };

  const universityId = 'university-uuid-1';
  const mockUniversity = {
    id: universityId,
    name: 'State University',
    username: 'stateuni',
    isVerified: false,
    website: 'https://state.edu',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUniversityRepo.save.mockImplementation((u) => Promise.resolve(u));
    service = new CampusService(
      mockUniversityRepo as never,
      mockUniversityUserRepo as never,
    );
  });

  it('rejects an unauthorized user attempting to update university profile', async () => {
    mockUniversityRepo.findOne.mockResolvedValue(mockUniversity);
    mockUniversityUserRepo.findOne.mockResolvedValue(null);

    const unauthorizedActor = {
      id: 'random-student-id',
      role: 'student',
      isAdmin: false,
    };

    await expect(
      service.updateUniversity(universityId, { website: 'https://hacked.edu' }, unauthorizedActor),
    ).rejects.toThrow(ForbiddenException);

    expect(mockUniversityRepo.save).not.toHaveBeenCalled();
  });

  it('allows an authorized university Admin to update details while stripping isVerified and id', async () => {
    mockUniversityRepo.findOne.mockResolvedValue({ ...mockUniversity });
    mockUniversityUserRepo.findOne.mockResolvedValue({
      id: 'membership-uni-1',
      role: 'Admin',
      isActive: true,
    });

    const uniAdminActor = {
      id: 'uni-admin-uuid',
      role: 'campus_admin',
      isAdmin: false,
    };

    const updates = {
      website: 'https://official.state.edu',
      id: 'attacker-id-override',
      isVerified: true,
    };

    const result = await service.updateUniversity(universityId, updates, uniAdminActor);

    expect(mockUniversityRepo.save).toHaveBeenCalled();
    const saved = mockUniversityRepo.save.mock.calls[0][0];

    expect(saved.website).toBe('https://official.state.edu');
    expect(saved.isVerified).toBe(false);
    expect(saved.id).toBe(universityId);
  });

  it('allows platform super_admin to update and verify university', async () => {
    mockUniversityRepo.findOne.mockResolvedValue({ ...mockUniversity });

    const superAdminActor = {
      id: 'super-admin-uuid',
      role: 'super_admin',
      isAdmin: true,
    };

    const updates = {
      isVerified: true,
      domain: 'state.edu',
    };

    await service.updateUniversity(universityId, updates, superAdminActor);

    expect(mockUniversityRepo.save).toHaveBeenCalled();
    const saved = mockUniversityRepo.save.mock.calls[0][0];
    expect(saved.isVerified).toBe(true);
    expect(saved.domain).toBe('state.edu');
  });
});
