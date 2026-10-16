import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Company Portal')
@Controller('company')
export class CompanyController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new company' })
  async registerCompany(@Request() req: any, @Body() body: any) {
    return this.companiesService.registerCompany(req.user.id, body);
  }

  @Get('my-companies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all companies the user belongs to' })
  async getMyCompanies(@Request() req: any) {
    return this.companiesService.getMyCompanies(req.user.id);
  }

  // --- Jobs endpoints (AUD-015) ---
  @Get('jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get jobs for company' })
  async getJobs(
    @Headers('x-company-id') companyId: string,
    @Request() req: any,
  ) {
    return this.companiesService.getJobs(companyId, req.user);
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create job posting' })
  async createJob(
    @Headers('x-company-id') companyId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.companiesService.createJob(companyId, body, req.user);
  }

  @Put('jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update job posting' })
  async updateJob(
    @Headers('x-company-id') companyId: string,
    @Param('jobId') jobId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.companiesService.updateJob(companyId, jobId, body, req.user);
  }

  @Delete('jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete job posting' })
  async deleteJob(
    @Headers('x-company-id') companyId: string,
    @Param('jobId') jobId: string,
    @Request() req: any,
  ) {
    return this.companiesService.deleteJob(companyId, jobId, req.user);
  }

  // --- Team endpoints (AUD-015) ---
  @Get('team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company team members' })
  async getTeam(
    @Headers('x-company-id') companyId: string,
    @Request() req: any,
  ) {
    return this.companiesService.getTeam(companyId, req.user);
  }

  @Post('team/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite company team member' })
  async inviteTeamMember(
    @Headers('x-company-id') companyId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.companiesService.inviteTeamMember(companyId, body, req.user);
  }

  @Delete('team/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove company team member' })
  async removeTeamMember(
    @Headers('x-company-id') companyId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.companiesService.removeTeamMember(companyId, userId, req.user);
  }

  // --- Applications endpoints (AUD-015) ---
  @Get('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get job applications' })
  async getApplications(
    @Headers('x-company-id') companyId: string,
    @Request() req: any,
  ) {
    return this.companiesService.getApplications(companyId, req.user);
  }

  @Put('applications/:id/stage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application stage' })
  async updateApplicationStage(
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body('stage') stage: string,
    @Request() req: any,
  ) {
    return this.companiesService.updateApplicationStage(
      companyId,
      id,
      stage,
      req.user,
    );
  }

  @Post('applications/mock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate mock applications' })
  async generateMockApplications(
    @Headers('x-company-id') companyId: string,
    @Request() req: any,
  ) {
    return this.companiesService.generateMockApplications(companyId, req.user);
  }

  // --- Parameterized routes placed last (AUD-014, AUD-024) ---
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company profile for admin' })
  async getCompanyById(@Param('id') id: string, @Request() req: any) {
    return this.companiesService.getCompanyById(id, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company profile' })
  async updateCompany(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.companiesService.updateCompany(id, body, req.user);
  }
}
