import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AssessmentAttempt } from '../database/entities/assessment-attempt.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { Question } from '../database/entities/question.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  async getAssessmentOverview(assessmentId: string) {
    const assessment = await this.assessmentRepo.findOne({
      where: [{ id: assessmentId }, { mongoId: assessmentId }],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const targetId = assessment.id;
    const completedStatuses = ['submitted', 'auto_submitted', 'timed_out'];

    const totalAttempts = await this.attemptRepo.count({
      where: [{ assessmentId: targetId }, { assessmentId: assessmentId }],
    });

    const completedAttempts = await this.attemptRepo.count({
      where: [
        { assessmentId: targetId, status: In(completedStatuses) },
        { assessmentId: assessmentId, status: In(completedStatuses) },
      ],
    });

    const stats = await this.attemptRepo
      .createQueryBuilder('a')
      .select('COALESCE(AVG(a.score), 0)', 'avgScore')
      .addSelect('COALESCE(MAX(a.score), 0)', 'maxScore')
      .addSelect('COALESCE(MIN(a.score), 0)', 'minScore')
      .addSelect('COALESCE(AVG(a.timeSpentSeconds), 0)', 'avgTimeSpent')
      .addSelect('COUNT(CASE WHEN a.passed = true THEN 1 END)', 'totalPassed')
      .where('(a.assessmentId = :targetId OR a.assessmentId = :assessmentId)', {
        targetId,
        assessmentId,
      })
      .andWhere('a.status IN (:...statuses)', { statuses: completedStatuses })
      .getRawOne();

    return {
      assessment: {
        title: assessment.title,
        status: assessment.status,
      },
      participation: {
        total: totalAttempts,
        completed: completedAttempts,
      },
      metrics: {
        avgScore: Number(stats?.avgScore || 0),
        maxScore: Number(stats?.maxScore || 0),
        minScore: Number(stats?.minScore || 0),
        avgTimeSpent: Number(stats?.avgTimeSpent || 0),
        totalPassed: Number(stats?.totalPassed || 0),
      },
    };
  }

  async getAssessmentLeaderboard(assessmentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const completedStatuses = ['submitted', 'auto_submitted', 'timed_out'];

    const [data, total] = await this.attemptRepo.findAndCount({
      where: [
        { assessmentId, status: In(completedStatuses) },
      ],
      order: { score: 'DESC', timeSpentSeconds: 'ASC' },
      skip,
      take: limit,
      select: {
        id: true,
        studentName: true,
        studentEmail: true,
        studentUid: true,
        score: true,
        maxScore: true,
        percentage: true,
        passed: true,
        timeSpentSeconds: true,
        startedAt: true,
        submittedAt: true,
        violations: true,
        tabSwitchCount: true,
        fullscreenExitCount: true,
      },
    });

    return {
      data: data.map((d) => ({ ...d, _id: d.id })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getQuestionAnalytics(assessmentId: string) {
    const completedStatuses = ['submitted', 'auto_submitted', 'timed_out'];

    const attempts = await this.attemptRepo.find({
      where: [{ assessmentId, status: In(completedStatuses) }],
      select: { id: true, responses: true },
    });

    const questionMap = new Map<
      string,
      { totalAttempts: number; correctCount: number; totalTime: number; totalMarks: number }
    >();

    for (const att of attempts) {
      const responses = Array.isArray(att.responses) ? att.responses : [];
      for (const resp of responses) {
        if (!resp.questionId) continue;
        const qId = String(resp.questionId);
        const cur = questionMap.get(qId) || {
          totalAttempts: 0,
          correctCount: 0,
          totalTime: 0,
          totalMarks: 0,
        };
        cur.totalAttempts += 1;
        if (resp.isCorrect) cur.correctCount += 1;
        cur.totalTime += Number(resp.timeSpentSeconds || 0);
        cur.totalMarks += Number(resp.marksAwarded || 0);
        questionMap.set(qId, cur);
      }
    }

    const questionIds = Array.from(questionMap.keys());
    const questions = questionIds.length > 0
      ? await this.questionRepo.find({
          where: [{ id: In(questionIds) }],
        })
      : [];

    const detailsMap = new Map<string, Question>();
    for (const q of questions) {
      detailsMap.set(q.id, q);
    }

    const questionStats = [];
    for (const [qId, stat] of questionMap.entries()) {
      const q = detailsMap.get(qId);
      const successRate = stat.totalAttempts > 0 ? (stat.correctCount / stat.totalAttempts) * 100 : 0;
      questionStats.push({
        questionId: qId,
        title: q?.title || 'Question ' + qId,
        type: q?.questionType || 'mcq',
        difficulty: q?.difficulty || 'Medium',
        totalAttempts: stat.totalAttempts,
        correctCount: stat.correctCount,
        successRate: Math.round(successRate * 10) / 10,
        avgTimeSpent: stat.totalAttempts > 0 ? Math.round(stat.totalTime / stat.totalAttempts) : 0,
        avgMarksAwarded: stat.totalAttempts > 0 ? Math.round((stat.totalMarks / stat.totalAttempts) * 10) / 10 : 0,
      });
    }

    questionStats.sort((a, b) => a.successRate - b.successRate);
    return questionStats;
  }
}
