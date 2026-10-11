import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { Discussion } from '../database/entities/discussion.entity';
import { DiscussionReply } from '../database/entities/discussion-reply.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discussion, DiscussionReply]),
  ],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
