import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../database/entities/subject.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { Question } from '../database/entities/question.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async create(dto: CreateSubjectDto, adminUser: any, ip = '', userAgent = '') {
    const cleanCode = dto.code.trim().toUpperCase();
    const existing = await this.subjectRepo.findOne({ where: { code: cleanCode } });
    if (existing) {
      throw new ConflictException(`Subject with code '${cleanCode}' already exists.`);
    }

    const subject = this.subjectRepo.create({
      code: cleanCode,
      name: dto.name.trim(),
      description: dto.description || '',
      semester: dto.semester,
      department: dto.department || '',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    const saved = await this.subjectRepo.save(subject);

    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        actorId: adminUser?.id || adminUser?._id,
        actorEmail: adminUser?.email,
        action: 'CREATE_SUBJECT',
        target: saved.id,
        targetType: 'Subject',
        metadata: { code: saved.code, name: saved.name },
        ipAddress: ip,
        userAgent,
      }),
    );

    return { success: true, subject: saved };
  }

  async findAll(params: {
    semester?: number;
    department?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const qb = this.subjectRepo.createQueryBuilder('s');

    if (params.semester !== undefined && !isNaN(Number(params.semester))) {
      qb.andWhere('s.semester = :sem', { sem: Number(params.semester) });
    }
    if (params.department) {
      qb.andWhere('LOWER(s.department) = LOWER(:dept)', { dept: params.department });
    }
    if (params.isActive !== undefined) {
      qb.andWhere('s.isActive = :active', { active: Boolean(params.isActive) });
    }
    if (params.search) {
      qb.andWhere('(LOWER(s.name) LIKE :q OR LOWER(s.code) LIKE :q)', {
        q: `%${params.search.toLowerCase()}%`,
      });
    }

    const subjects = await qb.orderBy('s.name', 'ASC').getMany();
    return { success: true, count: subjects.length, subjects };
  }

  async findById(id: string) {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    return { success: true, subject };
  }

  async update(id: string, dto: UpdateSubjectDto, adminUser: any, ip = '', userAgent = '') {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    if (dto.code && dto.code.trim().toUpperCase() !== subject.code) {
      const cleanCode = dto.code.trim().toUpperCase();
      const existing = await this.subjectRepo.findOne({ where: { code: cleanCode } });
      if (existing) {
        throw new ConflictException(`Subject code '${cleanCode}' is already taken.`);
      }
      subject.code = cleanCode;
    }

    if (dto.name) subject.name = dto.name.trim();
    if (dto.description !== undefined) subject.description = dto.description;
    if (dto.semester !== undefined) subject.semester = dto.semester;
    if (dto.department !== undefined) subject.department = dto.department;
    if (dto.isActive !== undefined) subject.isActive = dto.isActive;

    const saved = await this.subjectRepo.save(subject);

    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        actorId: adminUser?.id || adminUser?._id,
        actorEmail: adminUser?.email,
        action: 'UPDATE_SUBJECT',
        target: saved.id,
        targetType: 'Subject',
        metadata: { code: saved.code, name: saved.name },
        ipAddress: ip,
        userAgent,
      }),
    );

    return { success: true, subject: saved };
  }

  async toggleStatus(id: string, adminUser: any) {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    subject.isActive = !subject.isActive;
    await this.subjectRepo.save(subject);
    return { success: true, subject };
  }

  async delete(id: string, adminUser: any, ip = '', userAgent = '') {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    // Check if referenced by assessments
    const assessmentCount = await this.assessmentRepo.count({
      where: [{ subjectId: id }, { subjectCode: subject.code }],
    });

    // Check if referenced by questions
    const questionCount = await this.questionRepo.count({
      where: [{ subjectId: id }],
    });

    if (assessmentCount > 0 || questionCount > 0) {
      // Soft-deactivate to protect historical references
      subject.isActive = false;
      await this.subjectRepo.save(subject);

      return {
        success: true,
        deactivated: true,
        message: `Subject is referenced by ${assessmentCount} assessment(s) and ${questionCount} question(s). It has been deactivated instead of deleted to protect historical records.`,
      };
    }

    await this.subjectRepo.remove(subject);

    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        actorId: adminUser?.id || adminUser?._id,
        actorEmail: adminUser?.email,
        action: 'DELETE_SUBJECT',
        target: id,
        targetType: 'Subject',
        metadata: { code: subject.code, name: subject.name },
        ipAddress: ip,
        userAgent,
      }),
    );

    return { success: true, message: 'Subject deleted successfully' };
  }
}
