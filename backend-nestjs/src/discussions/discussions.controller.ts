import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DiscussionsService } from './discussions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  // ── Public: Get threads for a problem ───────────────────────────────────
  @Get('problem/:problemId')
  @ApiOperation({ summary: 'Get discussion threads for a problem' })
  async getThreads(@Param('problemId') problemId: string, @Query() query: any) {
    return this.discussionsService.getThreads(problemId, query);
  }

  // ── Public: Get a single thread ────────────────────────────────────────
  @Get(':threadId')
  @ApiOperation({ summary: 'Get a single discussion thread' })
  async getThread(@Param('threadId') threadId: string) {
    return this.discussionsService.getThread(threadId);
  }

  // ── Public: Get replies for a thread ───────────────────────────────────
  @Get(':threadId/replies')
  @ApiOperation({ summary: 'Get replies for a discussion thread' })
  async getReplies(@Param('threadId') threadId: string) {
    return this.discussionsService.getReplies(threadId);
  }

  // ── Authenticated: Create thread ───────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discussion thread' })
  async createThread(@CurrentUser('id') userId: string, @Body() data: any) {
    return this.discussionsService.createThread(userId, data);
  }

  // ── Authenticated: Delete thread ───────────────────────────────────────
  @Delete(':threadId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discussion thread (author only)' })
  async deleteThread(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
  ) {
    return this.discussionsService.deleteThread(userId, threadId);
  }

  // ── Authenticated: Vote on thread ──────────────────────────────────────
  @Put(':threadId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote or downvote a thread' })
  async voteThread(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.discussionsService.voteThread(userId, threadId, direction);
  }

  // ── Authenticated: Create reply ────────────────────────────────────────
  @Post(':threadId/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a discussion thread' })
  async createReply(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Body() data: any,
  ) {
    return this.discussionsService.createReply(userId, threadId, data);
  }

  // ── Authenticated: Delete reply ────────────────────────────────────────
  @Delete('replies/:replyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a reply (author only)' })
  async deleteReply(
    @CurrentUser('id') userId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.discussionsService.deleteReply(userId, replyId);
  }

  // ── Authenticated: Vote on reply ───────────────────────────────────────
  @Put('replies/:replyId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote or downvote a reply' })
  async voteReply(
    @CurrentUser('id') userId: string,
    @Param('replyId') replyId: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.discussionsService.voteReply(userId, replyId, direction);
  }
}
