import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ExamSecurityService } from './exam-security.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exam-security')
@UseGuards(JwtAuthGuard)
export class ExamSecurityController {
  constructor(private readonly examSecurityService: ExamSecurityService) {}

  @Post(':assessmentId/secure-session/init')
  @HttpCode(200)
  async initSession(
    @Param('assessmentId') assessmentId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.examSecurityService.initSecureSession(
      assessmentId,
      userId,
      body,
    );
  }

  @Post('session/:sessionId/heartbeat')
  @HttpCode(200)
  async heartbeat(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examSecurityService.processHeartbeat(sessionId, userId);
  }

  @Post('session/:sessionId/violation')
  @HttpCode(200)
  async reportViolation(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { eventType: string; metadata?: any },
  ) {
    return this.examSecurityService.reportViolation(
      sessionId,
      userId,
      body.eventType,
      body.metadata || {},
    );
  }
}

