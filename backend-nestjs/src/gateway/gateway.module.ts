import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppGateway } from './app.gateway';
import { AuthModule } from '../auth/auth.module';
import { Contest } from '../database/entities/contest.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Contest])],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
