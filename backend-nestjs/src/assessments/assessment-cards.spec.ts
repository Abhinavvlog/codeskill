jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
import { AssessmentsService } from './assessments.service';
const types = ['DSA', 'MCQ', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'CODE_OUTPUT'];
const questions = types.map((questionType, index) => ({
  id: `q-${index}`,
  questionType,
  difficulty: index === 0 ? 'hard' : 'easy',
}));
function setup() {
  const assessments = types.map((type, index) => ({
    id: `a-${index}`,
    questions: [`q-${index}`],
    type: 'mcq',
    status: 'published',
    allowedAttempts: 1,
    targetBatches: [],
    targetDepartments: [],
  }));
  const builder = {
    where: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn().mockResolvedValue(assessments),
  };
  builder.where.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  const questionRepo = { find: jest.fn().mockResolvedValue(questions) };
  const service = new AssessmentsService(
    { createQueryBuilder: () => builder } as never,
    { find: jest.fn().mockResolvedValue([]) } as never,
    questionRepo as never,
    {} as never,
  );
  return { service, questionRepo, assessments };
}
it('derives all five card types and difficulty from safe configured question metadata', async () => {
  const { service, questionRepo } = setup();
  const result = await service.getStudentAssessments({ id: 'student' });
  expect(result.assessments.map((a) => a.questionTypes)).toEqual(
    types.map((type) => [type]),
  );
  expect(result.assessments[0].difficulties).toEqual(['hard']);
  expect(questionRepo.find).toHaveBeenCalledWith(
    expect.objectContaining({
      select: { id: true, mongoId: true, questionType: true, difficulty: true },
    }),
  );
});
it('preserves eligibility filtering and derives mixed assessment badges without duplicate records', async () => {
  const { service, assessments } = setup();
  assessments[0].questions = ['q-0', 'q-1'];
  assessments[1].targetBatches = ['2025'] as never[];
  const result = await service.getStudentAssessments({
    id: 'student',
    studentProfile: { batch: '2026' },
  });
  expect(result.assessments).toHaveLength(4);
  expect(result.assessments[0].questionTypes).toEqual(['DSA', 'MCQ']);
});
