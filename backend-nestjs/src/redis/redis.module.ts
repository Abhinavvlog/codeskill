import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { OtpService } from './otp.service';
import { ThrottlerRedisStorageService } from './throttler-redis-storage.service';
import { EmailModule } from '../emails/email.module';

@Global()
@Module({
  imports: [EmailModule],
  providers: [
    RedisService,
    CacheService,
    OtpService,
    ThrottlerRedisStorageService,
  ],
  exports: [
    RedisService,
    CacheService,
    OtpService,
    ThrottlerRedisStorageService,
  ],
})
export class RedisModule {}

