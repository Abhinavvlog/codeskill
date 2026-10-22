import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockAssessmentRepo: any;
  let mockAttemptRepo: any;
  let mockQuestionRepo: any;
  let mockSecurityEventRepo: any;
  let mockAuditLogRepo: any;

  const mockAssessment = {
    id: 'af3df981-0978-4b0e-91a8-4bc3027e2363',
    title: 'Practice Assessment 3 - Problem Solving',
    code: 'EXAM-4103',
    status: 'published',
    type: 'mixed',
    durationMinutes: 60,
    totalMarks: 50,
    passingMarks: 25,
    questions: ['q-1', 'q-2'],
    sections: [],
  };

  beforeEach(() => {
    mockAssessmentRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockAttemptQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        avgScore: '32.5',
        maxScore: '50',
        minScore: '15',
        avgTimeSpent: '2542',
        totalPassed: '4',
        totalTabSwitches: '7',
        totalFullscreenExits: '3',
      }),
    };

    const mockCandidateQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalCandidates: '6',
        completedCandidates: '6',
      }),
    };

    let qbCallCount = 0;
    mockAttemptRepo = {
      count: jest.fn().mockResolvedValue(6),
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn(() => {
        qbCallCount++;
        return qbCallCount === 1
          ? mockAttemptQueryBuilder
          : mockCandidateQueryBuilder;
      }),
    };

    mockQuestionRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'q-1', title: 'Two Sum', type: 'coding', difficulty: 'easy' },
        { id: 'q-2', title: 'Valid Parentheses', type: 'mcq', difficulty: 'easy' },
      ]),
    };

    mockSecurityEventRepo = {
      findAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'evt-1',
            eventType: 'WINDOW_BLUR_OR_TAB_SWITCH',
            severity: 'MEDIUM',
            candidate: { name: 'Rohan Gupta', email: 'rohan@test.com' },
            createdAt: new Date(),
          },
        ],
        1,
      ]),
    };

    mockAuditLogRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'audit-1',
          action: 'ASSESSMENT_ANALYTICS_REVIEW',
          actorEmail: 'admin@codeskill.local',
          timestamp: new Date(),
          event: 'Reviewed analytics',
          riskWeight: 0,
        },
      ]),
    };

    service = new AnalyticsService(
      mockAttemptRepo,
      mockAssessmentRepo,
      mockQuestionRepo,
      mockSecurityEventRepo,
      mockAuditLogRepo,
    );
  });

  describe('resolveAssessment', () => {
    it('resolves assessment by valid UUID', async () => {
      mockAssessmentRepo.findOne.mockResolvedValueOnce(mockAssessment);

      const result = await service.resolveAssessment(
        'af3df981-0978-4b0e-91a8-4bc3027e2363',
      );

      expect(result).toEqual(mockAssessment);
      expect(mockAssessmentRepo.findOne).toHaveBeenCalledWith({
        where: [
          { id: 'af3df981-0978-4b0e-91a8-4bc3027e2363' },
          { mongoId: 'af3df981-0978-4b0e-91a8-4bc3027e2363' },
        ],
      });
    });

    it('resolves assessment by exam code (e.g. EXAM-4103)', async () => {
      mockAssessmentRepo.findOne.mockResolvedValueOnce(mockAssessment);

      const result = await service.resolveAssessment('EXAM-4103');

      expect(result).toEqual(mockAssessment);
      expect(mockAssessmentRepo.findOne).toHaveBeenCalledWith({
        where: [{ code: 'EXAM-4103' }, { mongoId: 'EXAM-4103' }],
      });
    });

    it('throws NotFoundException when assessment does not exist', async () => {
      mockAssessmentRepo.findOne.mockResolvedValueOnce(null);
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockAssessmentRepo.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.resolveAssessment('non-existent-assessment'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAssessmentOverview', () => {
    it('returns calculated analytics with candidate metrics, proctoring violations, and audit logs', async () => {
      mockAssessmentRepo.findOne.mockResolvedValueOnce(mockAssessment);

      const overview = await service.getAssessmentOverview(
        'af3df981-0978-4b0e-91a8-4bc3027e2363',
      );

      expect(overview.assessment.id).toBe(mockAssessment.id);
      expect(overview.assessment.code).toBe('EXAM-4103');
      expect(overview.participation.total).toBe(6);
      expect(overview.participation.completed).toBe(6);
      expect(overview.metrics.avgScore).toBe(32.5);
      expect(overview.metrics.passRate).toBe(66.7);
      expect(overview.proctoring.totalViolations).toBe(10);
      expect(overview.proctoring.recentEvents.length).toBe(1);
      expect(overview.auditLogs.length).toBe(1);
    });

    it('handles zero submissions safely without division by zero or NaN', async () => {
      mockAssessmentRepo.findOne.mockResolvedValueOnce(mockAssessment);
      mockAttemptRepo.count.mockResolvedValue(0);

      const emptyQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          avgScore: null,
          maxScore: null,
          minScore: null,
          avgTimeSpent: null,
          totalPassed: '0',
          totalTabSwitches: '0',
          totalFullscreenExits: '0',
        }),
      };
      mockAttemptRepo.createQueryBuilder.mockReturnValue(emptyQb);
      mockSecurityEventRepo.findAndCount.mockResolvedValue([[], 0]);
      mockAuditLogRepo.find.mockResolvedValue([]);

      const overview = await service.getAssessmentOverview(mockAssessment.id);

      expect(overview.participation.total).toBe(0);
      expect(overview.participation.completed).toBe(0);
      expect(overview.metrics.avgScore).toBe(0);
      expect(overview.metrics.passRate).toBe(0);
      expect(overview.proctoring.totalViolations).toBe(0);
    });
  });

  describe('getQuestionAnalytics', () => {
    it('aggregates response data and maps defined questions', async () => {
      mockAssessmentRepo.findOne.mockResolvedValueOnce(mockAssessment);
      mockAttemptRepo.find.mockResolvedValueOnce([
        {
          id: 'att-1',
          responses: [
            {
              questionId: 'q-1',
              isCorrect: true,
              timeSpentSeconds: 120,
              marksAwarded: 5,
            },
          ],
        },
      ]);

      const questions = await service.getQuestionAnalytics(mockAssessment.id);

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
