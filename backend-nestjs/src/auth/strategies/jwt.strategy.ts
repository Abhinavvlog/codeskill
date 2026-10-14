import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtSettings } from '../../config/jwt.config';
import { AccessTokenPayload, TokenService } from '../token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly tokens: TokenService,
  ) {
    // getOrThrow: there is deliberately no fallback secret (AUD-004 / X-01).
    const jwt = config.getOrThrow<JwtSettings>('jwt');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.secret,
      algorithms: ['HS256'],
      issuer: jwt.issuer,
      audience: jwt.audience,
      ignoreExpiration: false,
    });
  }

  /**
   * Runs after the signature, algorithm, issuer, audience and expiry have been
   * verified. Re-checks the live account (exists, active, tokenVersion).
   */
  async validate(payload: Partial<AccessTokenPayload> | null | undefined) {
    return this.tokens.validateAccessPayload(payload);
  }
}
