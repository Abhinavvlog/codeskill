import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { S3Module } from '../s3/s3.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';
import { LoginThrottleService } from './login-throttle.service';
import { User as UserEntity } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { RedisModule } from '../redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtSettings } from '../config/jwt.config';

@Module({
  imports: [
    S3Module,
    TypeOrmModule.forFeature([UserEntity, RefreshToken]),
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const settings = config.getOrThrow<JwtSettings>('jwt');
        return {
          secret: settings.secret,
          signOptions: {
            expiresIn: settings.accessTtlSeconds,
            issuer: settings.issuer,
            audience: settings.audience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService, LoginThrottleService],
  exports: [JwtStrategy, PassportModule, TokenService, AuthService],
})
export class AuthModule {}
