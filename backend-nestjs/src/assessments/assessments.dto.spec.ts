import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

const completeAssessmentConfiguration = {
  title: 'Semester assessment',
  code: 'SEM-2026',
  description: 'Assessment description',
  type: 'mcq',
  category: 'exam',
  durationMinutes: 60,
  passingMarks: 20,
  negativeMarking: true,
  allowedAttempts: 2,
  targetBatches: ['2026'],
  targetDepartments: ['engineering'],
  targetCourses: ['computer-science'],
  targetSections: ['A'],
  targetSemesters: ['1'],
  targetGroups: ['A'],
  startTime: '2026-10-15T09:00:00.000Z',
  endTime: '2026-10-15T10:00:00.000Z',
  shuffleQuestions: true,
  shuffleOptions: true,
  showResultImmediately: true,
  allowReview: true,
  instructions: ['Read each question carefully.'],
  proctoring: {
    enforceFullscreen: true,
    blockCopyPaste: true,
    detectTabSwitch: true,
    maxTabSwitches: 3,
    autoSubmitOnViolation: true,
  },
  sections: [{
    title: 'Section A',
    description: 'Core questions',
    order: 0,
    timeLimit: 30,
    autoSelection: { topic: 'Algorithms', easyCount: 1, mediumCount: 1, hardCount: 0 },
    questions: [{ questionId: 'question-uuid', marks: 2, negativeMarks: 0.5, order: 0 }],
  }],
};

describe('assessment create/update DTO parity', () => {
  it('accepts the full assessment configuration in both contracts', async () => {
    const createErrors = await validate(plainToInstance(CreateAssessmentDto, completeAssessmentConfiguration));
    const updateErrors = await validate(plainToInstance(UpdateAssessmentDto, completeAssessmentConfiguration));

    expect(createErrors).toHaveLength(0);
    expect(updateErrors).toHaveLength(0);
  });

  it('enforces the same minimum assessment duration during creation and editing', async () => {
    const createErrors = await validate(plainToInstance(CreateAssessmentDto, {
      ...completeAssessmentConfiguration,
      durationMinutes: 4,
    }));
    const updateErrors = await validate(plainToInstance(UpdateAssessmentDto, { durationMinutes: 4 }));

    expect(createErrors.some((error) => error.property === 'durationMinutes')).toBe(true);
    expect(updateErrors.some((error) => error.property === 'durationMinutes')).toBe(true);
  });
});
