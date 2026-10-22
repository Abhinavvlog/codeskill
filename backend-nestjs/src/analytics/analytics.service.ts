import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AssessmentAttempt } from '../database/entities/assessment-attempt.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { Question } from '../database/entities/question.entity';
import { ExamSecurityEvent } from '../database/entities/exam-security-event.entity';
import { AuditLog } from '../database/entities/audit-log.entity';

@Injectable()
export class AnalyticsService {
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(ExamSecurityEvent)
    private readonly securityEventRepo: Repository<ExamSecurityEvent>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * Safely resolves an assessment by UUID id, unique code, or mongoId without
   * triggering PostgreSQL UUID syntax errors.
   */
  async resolveAssessment(identifier: string): Promise<Assessment> {
    if (!identifier || typeof identifier !== 'string') {
      throw new NotFoundException('Assessment not found');
    }
    const trimmed = identifier.trim();

    let assessment: Assessment | null = null;
    if (this.UUID_REGEX.test(trimmed)) {
      assessment = await this.assessmentRepo.findOne({
        where: [{ id: trimmed }, { mongoId: trimmed }],
      });
    } else {
      assessment = await this.assessmentRepo.findOne({
        where: [{ code: trimmed }, { mongoId: trimmed }],
      });
      if (!assessment) {
        assessment = await this.assessmentRepo
          .createQueryBuilder('a')
          .where('LOWER(a.code) = LOWER(:code)', { code: trimmed })
          .orWhere('a.mongoId = :code', { code: trimmed })
          .getOne();
      }
    }

    if (!assessment) {
      throw new NotFoundException(`Assessment '${identifier}' not found`);
    }
    return assessment;
  }

  async getAssessmentOverview(identifier: string) {
    const assessment = await this.resolveAssessment(identifier);
    const targetId = assessment.id;
    const completedStatuses = ['submitted', 'auto_submitted', 'timed_out'];

    // Total and completed attempts
    const totalAttempts = await this.attemptRepo.count({
      where: [{ assessmentId: targetId }],
    });

    const completedAttempts = await this.attemptRepo.count({
      where: [{ assessmentId: targetId, status: In(completedStatuses) }],
    });

    // Aggregate score, time, pass stats
    const stats = await this.attemptRepo
      .createQueryBuilder('a')
      .select('COALESCE(AVG(a.score), 0)', 'avgScore')
      .addSelect('COALESCE(MAX(a.score), 0)', 'maxScore')
      .addSelect('COALESCE(MIN(a.score), 0)', 'minScore')
      .addSelect('COALESCE(AVG(a.timeSpentSeconds), 0)', 'avgTimeSpent')
      .addSelect('COUNT(CASE WHEN a.passed = true THEN 1 END)', 'totalPassed')
      .addSelect('COALESCE(SUM(a.tabSwitchCount), 0)', 'totalTabSwitches')
      .addSelect('COALESCE(SUM(a.fullscreenExitCount), 0)', 'totalFullscreenExits')
      .where('a.assessmentId = :targetId', { targetId })
      .andWhere('a.status IN (:...statuses)', { statuses: completedStatuses })
      .getRawOne();

    // Unique candidate counts
    const candidateStats = await this.attemptRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.student_id)', 'totalCandidates')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN a.status IN (:...statuses) THEN a.student_id END)',
        'completedCandidates',
      )
      .where('a.assessmentId = :targetId', { targetId })
      .setParameter('statuses', completedStatuses)
      .getRawOne();

    // Proctoring telemetry events count and recent list
    let securityEvents: ExamSecurityEvent[] = [];
    let securityEventsCount = 0;
    try {
      const res = await this.securityEventRepo.findAndCount({
        where: { assessmentId: targetId },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: { candidate: true },
      });
      securityEvents = res[0];
      securityEventsCount = res[1];
    } catch {
      securityEvents = [];
      securityEventsCount = 0;
    }

    // Recent audit logs
    const auditLogs = await this.auditLogRepo
      .find({
        where: { assessmentId: targetId },
        order: { timestamp: 'DESC' },
        take: 10,
      })
      .catch(() => []);

    const totalPassed = Number(stats?.totalPassed || 0);
    const passRate =
      completedAttempts > 0
        ? Number(((totalPassed / completedAttempts) * 100).toFixed(1))
        : 0;

    return {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        code: assessment.code,
        status: assessment.status,
        type: assessment.type,
        durationMinutes: assessment.durationMinutes,
        totalMarks: assessment.totalMarks || 100,
        passingMarks: assessment.passingMarks || 40,
      },
      participation: {
        total: totalAttempts,
        completed: completedAttempts,
        totalCandidates: Number(candidateStats?.totalCandidates || totalAttempts),
        completedCandidates: Number(
          candidateStats?.completedCandidates || completedAttempts,
        ),
      },
      metrics: {
        avgScore: Number(Number(stats?.avgScore || 0).toFixed(1)),
        maxScore: Number(stats?.maxScore || 0),
        minScore: Number(stats?.minScore || 0),
        avgTimeSpent: Math.round(Number(stats?.avgTimeSpent || 0)),
        totalPassed,
        passRate,
      },
      proctoring: {
        totalViolations:
          Number(stats?.totalTabSwitches || 0) +
          Number(stats?.totalFullscreenExits || 0),
        totalTabSwitches: Number(stats?.totalTabSwitches || 0),
        totalFullscreenExits: Number(stats?.totalFullscreenExits || 0),
        securityEventsCount,
        recentEvents: securityEvents.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          severity: e.severity,
          candidateName: e.candidate?.name || 'Candidate',
          candidateEmail: e.candidate?.email || '',
          createdAt: e.createdAt,
          metadata: e.metadata,
        })),
      },
      auditLogs: auditLogs.map((a) => ({
        id: a.id,
        action: a.action,
        actorEmail: a.actorEmail,
        timestamp: a.timestamp,
        event: a.event,
        riskWeight: a.riskWeight,
      })),
    };
  }

  async getAssessmentLeaderboard(identifier: string, page = 1, limit = 20) {
    const assessment = await this.resolveAssessment(identifier);
    const targetId = assessment.id;
    const skip = (page - 1) * limit;
    const completedStatuses = ['submitted', 'auto_submitted', 'timed_out'];

    const [data, total] = await this.attemptRepo.findAndCount({
      where: [{ assessmentId: targetId, status: In(completedStatuses) }],
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

  async getQuestionAnalytics(identifier: string) {
    const assessment = await this.resolveAssessment(identifier);
    const targetId = assessment.id;
    const completedStatuses = ['submitted', 'auto_submitted', 'timed_out'];

    const attempts = await this.attemptRepo.find({
      where: [{ assessmentId: targetId, status: In(completedStatuses) }],
      select: { id: true, responses: true },
    });

    // Collect all question IDs defined on the assessment (from questions array or sections)
    const definedQuestionIds = new Set<string>();
    if (Array.isArray(assessment.questions)) {
      for (const q of assessment.questions) {
        if (q) definedQuestionIds.add(String(q));
      }
    }
    if (Array.isArray(assessment.sections)) {
      for (const s of assessment.sections) {
        if (Array.isArray(s?.questions)) {
          for (const q of s.questions) {
            const qId = (q as any)?.questionId || (q as any)?.id;
            if (qId) definedQuestionIds.add(String(qId));
          }
        }
      }
    }

    const questionMap = new Map<
      string,
      {
        totalAttempts: number;
        correctCount: number;
        totalTime: number;
        totalMarks: number;
      }
    >();

    // Initialize all defined questions with 0 attempts
    for (const qId of definedQuestionIds) {
      questionMap.set(qId, {
        totalAttempts: 0,
        correctCount: 0,
        totalTime: 0,
        totalMarks: 0,
      });
    }

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

    const allQuestionIds = Array.from(questionMap.keys());
    const validUuids = allQuestionIds.filter((id) => this.UUID_REGEX.test(id));

    const questions =
      validUuids.length > 0
        ? await this.questionRepo.find({
            where: [{ id: In(validUuids) }],
          })
        : [];

    const detailsMap = new Map<string, Question>();
    for (const q of questions) {
      detailsMap.set(q.id, q);
    }

    const questionStats = [];
    for (const [qId, stat] of questionMap.entries()) {
      const q = detailsMap.get(qId);
      const successRate =
        stat.totalAttempts > 0
          ? (stat.correctCount / stat.totalAttempts) * 100
          : 0;
      questionStats.push({
        questionId: qId,
        title: q?.title || 'Question ' + qId,
        type: q?.questionType || 'mcq',
        difficulty: q?.difficulty || 'Medium',
        totalAttempts: stat.totalAttempts,
        correctCount: stat.correctCount,
        successRate: Math.round(successRate * 10) / 10,
        avgTimeSpent:
          stat.totalAttempts > 0
            ? Math.round(stat.totalTime / stat.totalAttempts)
            : 0,
        avgMarksAwarded:
          stat.totalAttempts > 0
            ? Math.round((stat.totalMarks / stat.totalAttempts) * 10) / 10
            : 0,
      });
    }

    questionStats.sort((a, b) => a.successRate - b.successRate);
    return questionStats;
  }
}
