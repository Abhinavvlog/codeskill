jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';

function createMockService(overrides: {
  assessments?: any[];
  attempts?: any[];
  questions?: any[];
} = {}) {
  const assessments = overrides.assessments || [];
  const attempts = overrides.attempts || [];
  const questions = overrides.questions || [];

  const builder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(assessments),
  };

  const assessmentRepo: any = {
    createQueryBuilder: () => builder,
    findOne: jest.fn().mockImplementation(async (query: any) => {
      const id = query.where?.[0]?.id || query.where?.[1]?.mongoId || query.where?.id;
      return assessments.find((a) => a.id === id || a.mongoId === id) || null;
    }),
    save: jest.fn().mockImplementation(async (a: any) => a),
    create: jest.fn().mockImplementation((a: any) => ({ ...a, id: 'created-id' })),
  };

  const attemptRepo: any = {
    find: jest.fn().mockImplementation(async () => attempts),
    findOne: jest.fn().mockImplementation(async (query: any) => {
      const cond = Array.isArray(query.where) ? query.where[0] : query.where;
      return (
        attempts.find(
          (att) =>
            (!cond.assessmentId || att.assessmentId === cond.assessmentId) &&
            (!cond.studentId || att.studentId === cond.studentId) &&
            (!cond.status || att.status === cond.status),
        ) || null
      );
    }),
    save: jest.fn().mockImplementation(async (att: any) => att),
    create: jest.fn().mockImplementation((att: any) => ({ ...att, id: 'att-created' })),
  };

  const questionRepo: any = {
    find: jest.fn().mockResolvedValue(questions),
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      return questions.find((q) => q.id === where?.id) || null;
    }),
  };

  const auditLogRepo: any = {
    create: jest.fn().mockImplementation((x) => x),
    save: jest.fn().mockResolvedValue(undefined),
  };

  const service = new AssessmentsService(
    assessmentRepo,
    attemptRepo,
    questionRepo,
    auditLogRepo,
    undefined,
    undefined,
    undefined,
    undefined,
  );

  return { service, assessmentRepo, attemptRepo, questionRepo, auditLogRepo, builder };
}

describe('Semester-Wise Assessment System: Targeting & Access Control', () => {
  const sem4Assessment: any = {
    id: 'sem4-exam',
    title: 'Operating Systems & Concurrency',
    code: 'CS401',
    status: 'published',
    durationMinutes: 60,
    totalMarks: 50,
    allowedAttempts: 1,
    targetSemesters: ['4'],
    targetBatches: ['2026'],
    targetDepartments: ['Computer Science'],
    targetSections: ['CSE-A'],
    targetGroups: ['A'],
    questions: ['q1'],
    created_by_id: 'faculty-alice',
  };

  const multiSemAssessment: any = {
    id: 'multi-sem-exam',
    title: 'Inter-Semester Coding Contest',
    code: 'CONTEST2026',
    status: 'published',
    durationMinutes: 90,
    totalMarks: 100,
    allowedAttempts: 1,
    targetSemesters: ['3', '4', '5'],
    questions: ['q1'],
    created_by_id: 'faculty-alice',
  };

  const openAssessment: any = {
    id: 'open-exam',
    title: 'General Coding Practice',
    code: 'GEN101',
    status: 'published',
    durationMinutes: 45,
    totalMarks: 30,
    allowedAttempts: 0,
    targetSemesters: [],
    questions: ['q1'],
    created_by_id: 'faculty-bob',
  };

  const eligibleStudent = {
    id: 'student-sem-4',
    name: 'Eligible Student',
    email: 'sem4@university.edu',
    studentProfile: {
      semester: 4,
      year: 2,
      section: 'CSE-A',
      group: 'A',
      batch: '2026',
      department: 'Computer Science',
    },
  };

  const wrongSemesterStudent = {
    id: 'student-sem-6',
    name: 'Wrong Semester Student',
    email: 'sem6@university.edu',
    studentProfile: {
      semester: 6,
      year: 3,
      section: 'CSE-A',
      group: 'A',
      batch: '2026',
      department: 'Computer Science',
    },
  };

  const wrongSectionStudent = {
    id: 'student-wrong-sec',
    name: 'Wrong Section Student',
    email: 'secb@university.edu',
    studentProfile: {
      semester: 4,
      year: 2,
      section: 'CSE-B',
      group: 'A',
      batch: '2026',
      department: 'Computer Science',
    },
  };

  const wrongGroupStudent = {
    id: 'student-wrong-group',
    name: 'Wrong Group Student',
    email: 'groupb@university.edu',
    studentProfile: {
      semester: 4,
      year: 2,
      section: 'CSE-A',
      group: 'B',
      batch: '2026',
      department: 'Computer Science',
    },
  };

  const unassignedStudent = {
    id: 'student-unassigned',
    name: 'Unassigned Student',
    email: 'unassigned@university.edu',
    studentProfile: {},
  };

  describe('Student Dashboard Visibility (getStudentAssessments)', () => {
    it('returns only assessments matching the student semester and cohort restrictions', async () => {
      const { service } = createMockService({
        assessments: [sem4Assessment, multiSemAssessment, openAssessment],
        questions: [{ id: 'q1', questionType: 'MCQ', difficulty: 'medium' }],
      });

      const resEligible = await service.getStudentAssessments(eligibleStudent);
      const resWrongSem = await service.getStudentAssessments(wrongSemesterStudent);
      const resUnassigned = await service.getStudentAssessments(unassignedStudent);

      // Eligible student (Semester 4, CSE-A, Group A, Batch 2026) sees all 3
      expect(resEligible.assessments.map((a) => a.id)).toEqual([
        'sem4-exam',
        'multi-sem-exam',
        'open-exam',
      ]);

      // Semester 6 student should NOT see Semester 4 exam, but sees open and (if included) not sem4
      expect(resWrongSem.assessments.map((a) => a.id)).toEqual(['open-exam']);

      // Unassigned student sees open assessments with no semester restrictions
      expect(resUnassigned.assessments.map((a) => a.id)).toEqual(['open-exam']);
    });
  });

  describe('Direct ID/URL Access Denied for Cross-Semester Students', () => {
    it('allows eligible student to view overview, start attempt, and get results', async () => {
      const attempt = {
        id: 'attempt-1',
        assessmentId: sem4Assessment.id,
        studentId: eligibleStudent.id,
        status: 'in_progress',
        startedAt: new Date(),
        score: 0,
      };
      const { service } = createMockService({
        assessments: [sem4Assessment],
        attempts: [attempt],
        questions: [{ id: 'q1', marks: 10, questionType: 'MCQ' }],
      });

      const overview = await service.getStudentAssessmentOverview('sem4-exam', eligibleStudent);
      expect(overview.success).toBe(true);
      expect(overview.assessment.id).toBe('sem4-exam');
    });

    it('denies student in different semester from accessing overview via direct ID/slug', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.getStudentAssessmentOverview('sem4-exam', wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies student in different semester from starting an attempt session', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.startStudentAttempt('sem4-exam', wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies student in different semester from retaking an attempt session', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.retakeStudentAttempt('sem4-exam', wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies student in different semester from saving progress (autosave)', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.saveProgress('sem4-exam', { responses: [] }, wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies student in different semester from submitting an attempt', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.submitAttempt('sem4-exam', { responses: [] }, wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies student in different semester from viewing results/scorecard', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.getStudentResult('sem4-exam', wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies student in different semester from proctoring verification and telemetry', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.verifyIdentity('sem4-exam', {}, wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.recordViolation('sem4-exam', { type: 'tab_switch' }, wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.recordProctorCapture('sem4-exam', { type: 'webcam', image: 'base64' }, wrongSemesterStudent),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Multi-Semester Matching & String/Number Normalization', () => {
    it('allows students in any of the targeted semesters (e.g. Semesters 3, 4, 5)', async () => {
      const studentSem3 = {
        id: 's3',
        studentProfile: { semester: '3' },
      };
      const studentSem5 = {
        id: 's5',
        studentProfile: { semester: 'Semester 5' },
      };
      const studentSem2 = {
        id: 's2',
        studentProfile: { semester: 2 },
      };

      const { service } = createMockService({ assessments: [multiSemAssessment] });

      const overview3 = await service.getStudentAssessmentOverview('multi-sem-exam', studentSem3);
      expect(overview3.assessment.id).toBe('multi-sem-exam');

      const overview5 = await service.getStudentAssessmentOverview('multi-sem-exam', studentSem5);
      expect(overview5.assessment.id).toBe('multi-sem-exam');

      await expect(
        service.getStudentAssessmentOverview('multi-sem-exam', studentSem2),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Section, Group, Batch, and Department Restrictions', () => {
    it('enforces section restriction when semester matches', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.getStudentAssessmentOverview('sem4-exam', wrongSectionStudent),
      ).rejects.toThrow(ForbiddenException);
    });

    it('enforces group restriction when semester and section match', async () => {
      const { service } = createMockService({ assessments: [sem4Assessment] });

      await expect(
        service.getStudentAssessmentOverview('sem4-exam', wrongGroupStudent),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Faculty Authorization Scope', () => {
    const facultyAlice = { id: 'faculty-alice', role: 'faculty' };
    const facultyBob = { id: 'faculty-bob', role: 'faculty' };
    const adminUser = { id: 'admin-super', role: 'admin' };

    it('allows author faculty to update assessment', async () => {
      const { service } = createMockService({ assessments: [{ ...sem4Assessment }] });

      const res = await service.update('sem4-exam', { title: 'Updated OS Exam' }, facultyAlice);
      expect(res.success).toBe(true);
    });

    it('denies unauthorized faculty from updating assessment created by another faculty', async () => {
      const { service } = createMockService({ assessments: [{ ...sem4Assessment }] });

      await expect(
        service.update('sem4-exam', { title: 'Hijacked Title' }, facultyBob),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies unauthorized faculty from toggling status or archiving another faculty assessment', async () => {
      const { service } = createMockService({ assessments: [{ ...sem4Assessment }] });

      await expect(
        service.updateStatus('sem4-exam', 'ongoing', facultyBob),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.delete('sem4-exam', facultyBob),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies unauthorized faculty from viewing results of another faculty assessment', async () => {
      const { service } = createMockService({ assessments: [{ ...sem4Assessment }] });

      await expect(
        service.getAssessmentResults('sem4-exam', facultyBob),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows system admin to manage and view results for any assessment', async () => {
      const { service } = createMockService({ assessments: [{ ...sem4Assessment }] });

      const res = await service.getAssessmentResults('sem4-exam', adminUser);
      expect(res.success).toBe(true);
      expect(Array.isArray(res.attempts)).toBe(true);
    });
  });
});
