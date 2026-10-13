import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && (user.role === 'super_admin' || user.isSuperAdmin)) {
      return true;
    }

    throw new ForbiddenException('Requires super_admin privileges');
  }
}
