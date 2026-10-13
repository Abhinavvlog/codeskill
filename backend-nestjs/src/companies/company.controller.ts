import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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

  // Note: Express backend didn't technically require a guard specifically for this but it had authorizeCompany
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company profile for admin' })
  async getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id);
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
