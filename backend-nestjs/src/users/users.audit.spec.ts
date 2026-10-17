jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

describe('UsersService and UsersController Audit Verification (AUD-035, AUD-041)', () => {
  let service: UsersService;
  let controller: UsersController;

  const mockUserEntity: any = {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Audit Test User',
    username: 'audituser',
    email: 'sensitive-email@example.com',
    password: '$2a$10$hashedpasswordstring',
    salt: 'randomsalt',
    role: 'student',
    isAdmin: false,
    isActive: true,
    avatar: 'https://example.com/avatar.png',
    bio: 'Public bio',
    profile: {
      institution: 'Chandigarh University',
      role: 'student',
      preferredLanguage: 'TypeScript',
      privatePhone: '9999999999',
    },
    stats: {
      xp: 1500,
      totalSolved: 10,
      currentStreak: 5,
      rank: 'Learner',
    },
    solvedProblems: ['two-sum'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockUserRepository: any = {
    findOne: jest.fn().mockResolvedValue(mockUserEntity),
    query: jest.fn().mockResolvedValue([]),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockProblemRepository: any = {
    find: jest.fn().mockResolvedValue([
      {
        slug: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        tags: ['array', 'hash-table'],
        stats: { acceptanceRate: 85 },
      },
    ]),
  };

  beforeEach(() => {
    service = new UsersService(mockUserRepository, mockProblemRepository);
    controller = new UsersController(service);
    jest.clearAllMocks();
  });

  describe('AUD-035: Public Profile Sanitization', () => {
    it('should return safe public profile without sensitive fields', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...mockUserEntity });

      const profile: any = await service.getPublicProfile('audituser');

      expect(profile).toBeDefined();
      expect(profile.username).toBe('audituser');
      expect(profile.name).toBe('Audit Test User');

      // Sensitive fields MUST NOT be present in public profile
      expect(profile.email).toBeUndefined();
      expect(profile.password).toBeUndefined();
      expect(profile.salt).toBeUndefined();
      expect(profile.role).toBeUndefined();
      expect(profile.isAdmin).toBeUndefined();
      expect(profile.profile.privatePhone).toBeUndefined();

      // Solved problems should be mapped safely
      expect(profile.solvedProblems).toHaveLength(1);
      expect(profile.solvedProblems[0].slug).toBe('two-sum');
    });
  });

  describe('AUD-041: Bounded Leaderboard Pagination', () => {
    it('should bound oversized or malformed limit to acceptable range in controller', async () => {
      const getLeaderboardSpy = jest.spyOn(service, 'getLeaderboard').mockResolvedValueOnce({
        success: true,
        leaderboard: [],
        total: 0,
      });

      // Upper bound check (capped at 200)
      await controller.getLeaderboard('99999');
      expect(getLeaderboardSpy).toHaveBeenCalledWith(200);

      // Lower bound check (minimum 1)
      getLeaderboardSpy.mockResolvedValueOnce({ success: true, leaderboard: [], total: 0 });
      await controller.getLeaderboard('-50');
      expect(getLeaderboardSpy).toHaveBeenCalledWith(1);

      // Default fallback check (50)
      getLeaderboardSpy.mockResolvedValueOnce({ success: true, leaderboard: [], total: 0 });
      await controller.getLeaderboard('invalid');
      expect(getLeaderboardSpy).toHaveBeenCalledWith(50);
    });
  });
});
