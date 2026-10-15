import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import {
  SubmitAssessmentDto,
  RecordViolationDto,
  VerifyIdentityDto,
  ProctorCaptureDto,
} from './dto/submit-assessment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Student Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentsStudentController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('my-assessments')
  @ApiOperation({ summary: 'Get assigned assessments for current candidate' })
  async getMyAssessments(@CurrentUser() studentUser: any) {
    return this.assessmentsService.getStudentAssessments(studentUser);
  }

  @Get(':id/overview')
  @ApiOperation({
    summary: 'Get assessment briefing and candidate eligibility',
  })
  async getOverview(@Param('id') id: string, @CurrentUser() studentUser: any) {
    return this.assessmentsService.getStudentAssessmentOverview(
      id,
      studentUser,
    );
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Begin or resume assessment attempt session' })
  async startAttempt(@Param('id') id: string, @CurrentUser() studentUser: any) {
    return this.assessmentsService.startStudentAttempt(id, studentUser);
  }

  @Post(':id/retake')
  @ApiOperation({ summary: 'Redo / Retake assessment session for practice' })
  async retakeAttempt(
    @Param('id') id: string,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.retakeStudentAttempt(id, studentUser);
  }

  @Post(':id/verify-identity')
  @ApiOperation({ summary: 'Verify candidate identity before assessment start' })
  async verifyIdentity(
    @Param('id') id: string,
    @Body() dto: VerifyIdentityDto,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.verifyIdentity(id, dto, studentUser);
  }

  @Post(':id/violations')
  @ApiOperation({ summary: 'Record timestamped proctoring violation and secure evidence' })
  async recordViolation(
    @Param('id') id: string,
    @Body() dto: RecordViolationDto,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.recordViolation(id, dto, studentUser);
  }

  @Post(':id/proctor-capture')
  @ApiOperation({ summary: 'Receive proctoring frame capture from @peepl/proctoring' })
  async recordProctorCapture(
    @Param('id') id: string,
    @Body() dto: ProctorCaptureDto,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.recordProctorCapture(id, dto, studentUser);
  }

  @Post(':id/save-progress')
  @ApiOperation({ summary: 'Autosave candidate responses during test' })
  async saveProgress(
    @Param('id') id: string,
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.saveProgress(id, dto, studentUser);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit completed assessment for server evaluation',
  })
  async submitAttempt(
    @Param('id') id: string,
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.submitAttempt(id, dto, studentUser);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get candidate scorecard and performance review' })
  async getResult(@Param('id') id: string, @CurrentUser() studentUser: any) {
    return this.assessmentsService.getStudentResult(id, studentUser);
  }
}
