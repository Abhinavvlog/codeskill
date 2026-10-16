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
import { CampusService } from './campus.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get()
  @ApiOperation({ summary: 'Get all verified universities' })
  async getUniversities() {
    return this.campusService.getUniversities();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new university' })
  async registerUniversity(@Request() req: any, @Body() body: any) {
    return this.campusService.registerUniversity(req.user.id, body);
  }

  @Get('my-universities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all universities the user belongs to' })
  async getMyUniversities(@Request() req: any) {
    return this.campusService.getMyUniversities(req.user.id);
  }

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get university public profile' })
  async getUniversityProfile(@Param('username') username: string) {
    return this.campusService.getUniversityProfile(username);
  }

  // --- Batches endpoints (AUD-015) ---
  @Get('batches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all batches for university' })
  async getBatches(
    @Headers('x-university-id') universityId: string,
    @Request() req: any,
  ) {
    return this.campusService.getBatches(universityId, req.user);
  }

  @Post('batches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new batch' })
  async createBatch(
    @Headers('x-university-id') universityId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.campusService.createBatch(universityId, body, req.user);
  }

  @Get('batches/:batchId/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get students in batch' })
  async getBatchStudents(
    @Headers('x-university-id') universityId: string,
    @Param('batchId') batchId: string,
    @Request() req: any,
  ) {
    return this.campusService.getBatchStudents(universityId, batchId, req.user);
  }

  @Delete('batches/:batchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete batch' })
  async deleteBatch(
    @Headers('x-university-id') universityId: string,
    @Param('batchId') batchId: string,
    @Request() req: any,
  ) {
    return this.campusService.deleteBatch(universityId, batchId, req.user);
  }

  // --- Students endpoints (AUD-015) ---
  @Get('students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students for university' })
  async getStudents(
    @Headers('x-university-id') universityId: string,
    @Request() req: any,
  ) {
    return this.campusService.getStudents(universityId, req.user);
  }

  @Post('students/mock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate mock students' })
  async generateMockStudents(
    @Headers('x-university-id') universityId: string,
    @Request() req: any,
  ) {
    return this.campusService.generateMockStudents(universityId, req.user);
  }

  // --- Parameterized routes placed last (AUD-014, AUD-024) ---
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get university profile for portal' })
  async getUniversityById(@Param('id') id: string, @Request() req: any) {
    return this.campusService.getUniversityById(id, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update university profile' })
  async updateUniversity(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.campusService.updateUniversity(id, body, req.user);
  }
}
