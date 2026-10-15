import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { EvaluateAssessmentCodeDto } from './dto/evaluate-code.dto';
import { SubmissionRateLimitGuard } from '../common/guards/submission-rate-limit.guard';
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

  @Post(':id/evaluate-code')
  @UseGuards(SubmissionRateLimitGuard)
  async evaluateCode(
    @Param('id') id: string,
    @Body() dto: EvaluateAssessmentCodeDto,
    @CurrentUser() studentUser: any,
  ) {
    return this.assessmentsService.evaluateCode(id, dto, studentUser);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get candidate scorecard and performance review' })
  async getResult(@Param('id') id: string, @CurrentUser() studentUser: any) {
    return this.assessmentsService.getStudentResult(id, studentUser);
  }
}
