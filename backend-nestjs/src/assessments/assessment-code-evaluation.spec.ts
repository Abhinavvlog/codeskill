jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
import { AssessmentsService } from './assessments.service';

describe('Assessment code evaluation', () => {
  const assessments = { findOne: jest.fn() };
  const attempts = { findOne: jest.fn(), query: jest.fn() };
  const questions = { findOne: jest.fn() };
  const execution = { validateRequest: jest.fn() };
  const admission = { reserve: jest.fn(), release: jest.fn() };
  const queue = { add: jest.fn(), getJobCounts: jest.fn() };
  const student = { id: 'student-1' };
  const dto = {
    questionId: 'question-1',
    language: 'python',
    code: 'print(input())',
  };
  const assessment = {
    id: 'assessment-1',
    status: 'published',
    durationMinutes: 60,
    questions: ['question-1'],
  };
  const attempt = {
    studentId: student.id,
    startedAt: new Date(),
    status: 'in_progress',
  };
  const question = {
    id: 'question-1',
    questionType: 'dsa',
    supportedLanguages: ['python'],
    timeLimit: 2000,
    testCases: [
      { input: 'PUBLIC', expectedOutput: 'PUBLIC', isHidden: false },
      { input: 'SECRET', expectedOutput: 'HIDDEN', isHidden: true },
    ],
  };
  let service: AssessmentsService;
  beforeEach(() => {
    jest.resetAllMocks();
    assessments.findOne.mockResolvedValue(assessment);
    attempts.findOne.mockResolvedValue(attempt);
    attempts.query.mockResolvedValue([{ passed: 1, count: 4 }]);
    questions.findOne.mockResolvedValue(question);
    queue.getJobCounts.mockResolvedValue({ waiting: 0 });
    admission.reserve.mockResolvedValue('lease-1');
    queue.add.mockResolvedValue({ id: 'lease-1' });
    service = new AssessmentsService(
      assessments as never,
      attempts as never,
      questions as never,
      {} as never,
      execution as never,
      admission as never,
      undefined,
      queue as never,
    );
    jest.spyOn(service as any, 'isStudentTargeted').mockReturnValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('queues server-owned tests and returns only a job reference', async () => {
    const response = await service.evaluateCode(assessment.id, dto, student);
    expect(response).toEqual({
      success: true,
      status: 'queued',
      jobId: 'lease-1',
    });
    expect(JSON.stringify(response)).not.toContain('SECRET');
    expect(queue.add).toHaveBeenCalledWith(
      'run-code',
      expect.objectContaining({
        resultContext: 'assessment',
        userId: student.id,
        testCases: [
          expect.objectContaining({ input: 'PUBLIC', expected: 'PUBLIC' }),
          expect.objectContaining({
            input: 'SECRET',
            expected: 'HIDDEN',
            isHidden: true,
          }),
        ],
      }),
      expect.any(Object),
    );
    expect(attempts.query.mock.calls[0][1]).toEqual([
      assessment.id,
      student.id,
      question.id,
      2,
    ]);
  });
  it.each([
    'unassigned',
    'no attempt',
    'other owner',
    'expired',
    'unrelated question',
    'language',
  ])('rejects %s before queueing', async (reason) => {
    if (reason === 'unassigned')
      (service as any).isStudentTargeted.mockReturnValue(false);
    if (reason === 'no attempt') attempts.findOne.mockResolvedValue(null);
    if (reason === 'other owner')
      attempts.findOne.mockResolvedValue({
        ...attempt,
        studentId: 'someone-else',
      });
    if (reason === 'expired')
      attempts.findOne.mockResolvedValue({
        ...attempt,
        startedAt: new Date(0),
      });
    await expect(
      service.evaluateCode(
        assessment.id,
        {
          ...dto,
          ...(reason === 'unrelated question'
            ? { questionId: 'private-question' }
            : {}),
          ...(reason === 'language' ? { language: 'java' } : {}),
        },
        student,
      ),
    ).rejects.toThrow();
    expect(queue.add).not.toHaveBeenCalled();
    expect(admission.reserve).not.toHaveBeenCalled();
  });
  it('releases admission if enqueue fails', async () => {
    queue.add.mockRejectedValue(new Error('Redis offline'));
    await expect(
      service.evaluateCode(assessment.id, dto, student),
    ).rejects.toThrow('Unable to queue');
    expect(admission.release).toHaveBeenCalledWith(student.id, 'lease-1');
  });
  it('uses metadata test cases when the legacy column is empty', async () => {
    questions.findOne.mockResolvedValue({
      ...question,
      testCases: [],
      metadata: { testCases: [{ input: '1', output: '2', isHidden: true }] },
    });
    await service.evaluateCode(assessment.id, dto, student);
    expect(queue.add.mock.calls[0][1].testCases).toEqual([
      { id: 1, input: '1', expected: '2', isHidden: true },
    ]);
  });
});
