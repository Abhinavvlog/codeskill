import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User as UserEntity } from '../database/entities/user.entity';
import { Problem as ProblemEntity } from '../database/entities/problem.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ProblemEntity)
    private problemRepository: Repository<ProblemEntity>,
  ) {}

  private getTier(xp: number): string {
    if (xp >= 50000) return 'Grandmaster';
    if (xp >= 30000) return 'Master';
    if (xp >= 15000) return 'Expert';
    if (xp >= 8000) return 'Specialist';
    if (xp >= 3000) return 'Competent';
    if (xp >= 1000) return 'Learner';
    return 'Beginner';
  }

  async getLeaderboard(limit = 50) {
    try {
      const rawUsers: any[] = await this.userRepository.query(
        `SELECT id, name, username, uid, avatar, stats, "studentProfile"
         FROM users
         WHERE "isActive" = true
         ORDER BY COALESCE((stats->>'xp')::numeric, 0) DESC
         LIMIT $1`,
        [limit],
      );

      const leaderboard = rawUsers.map((u, idx) => {
        const stats = typeof u.stats === 'string' ? JSON.parse(u.stats) : (u.stats || {});
        const studentProfile = typeof u.studentProfile === 'string' ? JSON.parse(u.studentProfile) : (u.studentProfile || {});
        const xp = stats.xp ?? 0;

        return {
          rank: idx + 1,
          _id: u.id,
          name: u.name,
          username: u.username,
          uid: u.uid,
          avatar: u.avatar || '',
          xp,
          totalSolved: stats.totalSolved ?? 0,
          currentStreak: stats.currentStreak ?? 0,
          tier: this.getTier(xp),
          department: studentProfile.department || '',
          batch: studentProfile.batch || '',
        };
      });

      return { success: true, leaderboard, total: leaderboard.length };
    } catch {
      const users = await this.userRepository.find({
        where: { isActive: true },
        take: limit,
      });

      const sortedUsers = [...users].sort(
        (a, b) => (b.stats?.xp ?? 0) - (a.stats?.xp ?? 0),
      );

      const leaderboard = sortedUsers.map((u, idx) => ({
        rank: idx + 1,
        _id: u.id,
        name: u.name,
        username: u.username,
        uid: u.uid,
        avatar: u.avatar || '',
        xp: u.stats?.xp ?? 0,
        totalSolved: u.stats?.totalSolved ?? 0,
        currentStreak: u.stats?.currentStreak ?? 0,
        tier: this.getTier(u.stats?.xp ?? 0),
        department: u.studentProfile?.department || '',
        batch: u.studentProfile?.batch || '',
      }));

      return { success: true, leaderboard, total: leaderboard.length };
    }
  }

  async getPublicProfile(identifier: string) {
    let user;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUuid) {
      user = await this.userRepository.findOne({ where: { id: identifier } });
    } else {
      user = await this.userRepository.findOne({ where: { username: identifier.toLowerCase() } });
    }

    if (!user) return null;

    let solvedProblemsDetails: any[] = [];
    if (user.solvedProblems && user.solvedProblems.length > 0) {
      solvedProblemsDetails = await this.problemRepository.find({
        where: { slug: In(user.solvedProblems) },
        select: { slug: true, title: true, difficulty: true, tags: true, stats: true },
      });
      // Map to old structure format if needed
      solvedProblemsDetails = solvedProblemsDetails.map(p => ({
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        acceptanceRate: p.stats?.acceptanceRate || 0,
      }));
    }

    return {
      ...user,
      solvedProblemsDetails,
    };
  }
}
