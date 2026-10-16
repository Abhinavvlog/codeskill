import { ForbiddenException } from '@nestjs/common';
import { AssessmentAuthorGuard } from './assessment-author.guard';
import { AdminGuard } from './admin.guard';
const context = (role: string) => ({ switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as never;
describe('AssessmentAuthorGuard', () => {
  it.each(['teacher', 'faculty', 'instructor', 'admin', 'super_admin'])('allows assessment author %s', role => {
    expect(new AssessmentAuthorGuard().canActivate(context(role))).toBe(true);
  });
  it('does not give teachers general administration access', () => {
    expect(() => new AdminGuard().canActivate(context('teacher'))).toThrow(ForbiddenException);
  });
  it('rejects student access', () => {
    expect(() => new AssessmentAuthorGuard().canActivate(context('student'))).toThrow(ForbiddenException);
  });
});
