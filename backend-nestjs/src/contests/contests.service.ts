import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest } from '../database/entities/contest.entity';
import { ContestAttempt } from '../database/entities/contest-attempt.entity';

@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepo: Repository<Contest>,
    @InjectRepository(ContestAttempt)
    private readonly attemptRepo: Repository<ContestAttempt>,
  ) {}

  async getContests() {
    const list = await this.contestRepo.find({
      where: { isPublished: true, isPrivate: false },
      order: { startTime: 'DESC' },
    });
    return list.map((c) => ({ ...c, _id: c.id }));
  }

  async getContest(slug: string) {
    const contest = await this.contestRepo.findOne({
      where: { slug, isPublished: true },
    });
    if (!contest) throw new NotFoundException('Contest not found');
    return { ...contest, _id: contest.id };
  }

  async register(contestId: string, userId: string, password?: string) {
    const contest = await this.contestRepo.findOne({
      where: [{ id: contestId }, { mongoId: contestId }],
    });
    if (!contest) throw new NotFoundException('Contest not found');

    if (contest.isPrivate && contest.password !== password) {
      throw new Error('Invalid contest password');
    }

    const participants = Array.isArray(contest.participants) ? contest.participants : [];
    if (!participants.includes(userId)) {
      contest.participants = [...participants, userId];
      await this.contestRepo.save(contest);
    }

    return { success: true };
  }
}
