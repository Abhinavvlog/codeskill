import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin - Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new academic subject' })
  async create(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() adminUser: any,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.subjectsService.create(dto, adminUser, ip, userAgent);
  }

  @Get()
  @ApiOperation({ summary: 'List all subjects with semester/department filtering' })
  async findAll(
    @Query('semester') semester?: number,
    @Query('department') department?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.subjectsService.findAll({ semester, department, isActive, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  async findById(@Param('id') id: string) {
    return this.subjectsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subject details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() adminUser: any,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.subjectsService.update(id, dto, adminUser, ip, userAgent);
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a subject' })
  async toggleStatus(
    @Param('id') id: string,
    @CurrentUser() adminUser: any,
  ) {
    return this.subjectsService.toggleStatus(id, adminUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete or deactivate subject' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() adminUser: any,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.subjectsService.delete(id, adminUser, ip, userAgent);
  }
}
