import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.secret') || 'default',
      ignoreExpiration: false,
    });
  }

  async validate(payload: { id?: unknown } | null | undefined) {
    if (!payload || typeof payload.id !== 'string' || !isUUID(payload.id)) {
      throw new UnauthorizedException('Please log in to access this resource.');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.id },
    });
    if (!user || user.isActive !== true) {
      throw new UnauthorizedException('Please log in to access this resource.');
    }
    return user;
  }
}
