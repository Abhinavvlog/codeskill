import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { AdminGuard, TeacherGuard } from './admin.guard';

describe('AdminGuard & TeacherGuard (AUD-025)', () => {
  let adminGuard: AdminGuard;
  let teacherGuard: TeacherGuard;

  beforeEach(() => {
    adminGuard = new AdminGuard();
    teacherGuard = new TeacherGuard();
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('allows user with isAdmin: true', () => {
    const ctx = createMockContext({ id: 'u-1', isAdmin: true, role: 'student' });
    expect(adminGuard.canActivate(ctx)).toBe(true);
    expect(teacherGuard.canActivate(ctx)).toBe(true);
  });

  it.each(['admin', 'super_admin', 'student_admin', 'assessment_admin'])('allows administrative role %s', (role) => {
    const ctx = createMockContext({ id: 'u-2', role });
    expect(adminGuard.canActivate(ctx)).toBe(true);
  });

  it.each(['teacher', 'faculty', 'instructor'])('limits %s to teacher access (AUD-025)', (role) => {
    const ctx = createMockContext({ id: 'u-3', role });
    expect(teacherGuard.canActivate(ctx)).toBe(true);
    expect(() => adminGuard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects student or unauthorized user', () => {
    const ctxStudent = createMockContext({ id: 'u-6', role: 'student' });
    const ctxAnonymous = createMockContext(null);

    expect(() => adminGuard.canActivate(ctxStudent)).toThrow(ForbiddenException);
    expect(() => adminGuard.canActivate(ctxAnonymous)).toThrow(ForbiddenException);

    expect(() => teacherGuard.canActivate(ctxStudent)).toThrow(ForbiddenException);
    expect(() => teacherGuard.canActivate(ctxAnonymous)).toThrow(ForbiddenException);
  });
});
