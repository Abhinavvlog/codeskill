import { ExecutionContext, Injectable } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

/** Assessment authors do not gain access to unrelated administrative APIs. */
@Injectable()
export class AssessmentAuthorGuard extends AdminGuard {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (user && ['teacher', 'faculty', 'instructor'].includes(user.role)) return true;
    return super.canActivate(context);
  }
}
