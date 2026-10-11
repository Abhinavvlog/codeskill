import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../emails/email.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { CredentialEmailProcessor } from './credential-email.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { EmailJob } from '../database/entities/email-job.entity';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    TypeOrmModule.forFeature([User, AuditLog, EmailJob]),
    BullModule.registerQueue({
      name: 'credential-email',
    }),
  ],
  controllers: [StudentsController],
  providers: [StudentsService, CredentialEmailProcessor],
  exports: [StudentsService],
})
export class StudentsModule {}
