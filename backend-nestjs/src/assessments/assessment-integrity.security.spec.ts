jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';

describe('Assessment Integrity & Server-Side Scoring (AUD-002, NEW-001, NEW-002, NEW-003)', () => {
  let service: AssessmentsService;

  const mockAssessmentRepo = {
    findOne: jest.fn(),
  };
  const mockAttemptRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const mockQuestionRepo = {
    find: jest.fn(),
  };
  const mockAuditLogRepo = {
    save: jest.fn(),
  };
  const mockExecutionService = {
    runCode: jest.fn(),
  };

  const studentUser = {
    id: 'candidate-uuid-1',
    name: 'Alice Student',
    email: 'alice@cu.edu',
    uid: 'CU1001',
  };

  const assessmentId = 'assessment-uuid-1';
  const mockAssessment = {
    id: assessmentId,
    title: 'Midterm Examination',
    status: 'published',
    questions: ['q-mcq-1', 'q-coding-1'],
    totalMarks: 10,
    passingMarks: 5,
    negativeMarking: false,
    endTime: new Date(Date.now() + 3600000), // 1 hour in future
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAttemptRepo.save.mockImplementation((a) => Promise.resolve(a));

    service = new AssessmentsService(
      mockAssessmentRepo as never,
      mockAttemptRepo as never,
      mockQuestionRepo as never,
      mockAuditLogRepo as never,
      mockExecutionService as never,
    );
  });

  it('rejects submission if attempt does not belong to the calling candidate (NEW-001)', async () => {
    mockAssessmentRepo.findOne.mockResolvedValue(mockAssessment);
    mockAttemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      assessmentId,
      studentId: 'different-student-uuid', // Belongs to someone else!
      status: 'in_progress',
    });

    await expect(
      service.submitAttempt(assessmentId, { responses: [] }, studentUser),
    ).rejects.toThrow(ForbiddenException);

    expect(mockAttemptRepo.save).not.toHaveBeenCalled();
  });

  it('rejects submission if assessment end time has passed beyond grace period (NEW-002)', async () => {
    mockAssessmentRepo.findOne.mockResolvedValue({
      ...mockAssessment,
      endTime: new Date(Date.now() - 600000), // Expired 10 minutes ago (> 5 min grace)
    });
    mockAttemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      assessmentId,
      studentId: studentUser.id,
      status: 'in_progress',
    });

    await expect(
      service.submitAttempt(assessmentId, { responses: [] }, studentUser),
    ).rejects.toThrow(BadRequestException);

    expect(mockAttemptRepo.save).not.toHaveBeenCalled();
  });

  it('handles duplicate submissions idempotently without re-grading (NEW-003)', async () => {
    mockAssessmentRepo.findOne.mockResolvedValue(mockAssessment);
    mockAttemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      assessmentId,
      studentId: studentUser.id,
      status: 'submitted', // Already submitted
      score: 8,
      highestScore: 8,
      maxScore: 10,
      responses: [],
    });

    // Mock getStudentResult behavior when attempt is already submitted
    jest.spyOn(service, 'getStudentResult').mockResolvedValue({
      success: true,
      result: { score: 8, highestScore: 8 },
    } as never);

    const result = await service.submitAttempt(
      assessmentId,
      { responses: [] },
      studentUser,
    );

    expect(service.getStudentResult).toHaveBeenCalledWith(assessmentId, studentUser);
    expect(mockAttemptRepo.save).not.toHaveBeenCalled();
  });

  it('ignores client-supplied test case numbers and calculates MCQ marks strictly server-side (AUD-002)', async () => {
    mockAssessmentRepo.findOne.mockResolvedValue(mockAssessment);
    mockAttemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      assessmentId,
      studentId: studentUser.id,
      status: 'in_progress',
      startedAt: new Date(Date.now() - 10000),
    });
    mockAttemptRepo.find.mockResolvedValue([]); // No previous attempts

    const questionsInDb = [
      {
        id: 'q-mcq-1',
        questionType: 'single_choice',
        correctAnswer: 1, // Option 1 is the ONLY correct answer
        marks: 5,
        negativeMarks: 1,
      },
      {
        id: 'q-coding-1',
        questionType: 'coding',
        marks: 5,
        testCases: [
          { id: 'tc-1', input: '1', expectedOutput: '2' },
          { id: 'tc-2', input: '2', expectedOutput: '4' },
        ],
      },
    ];
    mockQuestionRepo.find.mockResolvedValue(questionsInDb);

    // Mock ExecutionService returning 1 out of 2 passed for coding question
    mockExecutionService.runCode.mockResolvedValue([
      { id: 'tc-1', passed: true, status: 'accepted' },
      { id: 'tc-2', passed: false, status: 'wrong_answer' },
    ]);

    // Attacker payload claims full 100% on coding and wrong answer on MCQ with claimed correct flag
    const maliciousPayload = {
      responses: [
        {
          questionId: 'q-mcq-1',
          selectedAnswer: 3, // WRONG answer (correct is 1)
          // Maliciously forged properties:
          isCorrect: true,
          marksAwarded: 5,
        },
        {
          questionId: 'q-coding-1',
          code: 'def solution(x): return x * 2',
          language: 'python',
          // Malicious client claims 100/100 test cases passed:
          testCasesPassed: 100,
          totalTestCases: 100,
        },
      ],
      timeSpentSeconds: 300,
    };

    const response = await service.submitAttempt(
      assessmentId,
      maliciousPayload as never,
      studentUser,
    );

    expect(mockAttemptRepo.save).toHaveBeenCalled();
    const savedAttempt = mockAttemptRepo.save.mock.calls[0][0];

    // MCQ answer 3 was wrong, so marksAwarded = 0
    const mcqResponse = savedAttempt.responses.find((r: any) => r.questionId === 'q-mcq-1');
    expect(mcqResponse.isCorrect).toBe(false);
    expect(mcqResponse.marksAwarded).toBe(0);

    // Coding question: ExecutionService reported 1 out of 2 passed (50% of 5 marks = 2.5 marks)
    const codingResponse = savedAttempt.responses.find((r: any) => r.questionId === 'q-coding-1');
    expect(codingResponse.testCasesPassed).toBe(1);
    expect(codingResponse.totalTestCases).toBe(2);
    expect(codingResponse.marksAwarded).toBe(2.5);

    // Total score is strictly calculated from server evaluations (0 + 2.5 = 2.5)
    expect(savedAttempt.score).toBe(2.5);
    expect(response.result.score).toBe(2.5);
  });
});
