import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * AUD-044 — Optional JWT guard.
 *
 * Behaves like JwtAuthGuard but never rejects the request:
 * - If the access token is valid, req.user is populated.
 * - If the token is absent, expired or invalid, the request proceeds with req.user = undefined.
 *
 * Use this on endpoints that must work regardless of access-token validity,
 * such as logout (where the refresh-token body payload carries the real credential).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Attempt JWT validation but catch errors silently.
    return super.canActivate(context) as Promise<boolean>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(_err: any, user: any, _info: any) {
    // Return the user if valid, or undefined — never throw.
    return user ?? undefined;
  }
}
