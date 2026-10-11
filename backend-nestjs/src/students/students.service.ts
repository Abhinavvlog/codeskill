import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { EmailJob } from '../database/entities/email-job.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as xlsx from 'xlsx';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(EmailJob)
    private readonly emailJobRepo: Repository<EmailJob>,
    @InjectQueue('credential-email')
    private readonly credentialEmailQueue: Queue,
  ) {}

  private generateSecurePassword(length = 12): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    const bytes = crypto.randomBytes(length);
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars[bytes[i] % chars.length];
    }
    return pass + 'A1!';
  }

  async findAll(query: QueryStudentsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.userRepository.createQueryBuilder('student');
    qb.where('(student.isAssessmentStudent = :isAss OR student.uid IS NOT NULL)', {
      isAss: true,
    });

    if (query.search && query.search.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(student.name ILIKE :search OR student.email ILIKE :search OR student.uid ILIKE :search)',
        { search },
      );
    }

    if (query.department && query.department.trim()) {
      qb.andWhere("student.studentProfile->>'department' = :dept", {
        dept: query.department.trim(),
      });
    }

    if (query.batch && query.batch.trim()) {
      qb.andWhere("student.studentProfile->>'batch' = :batch", {
        batch: query.batch.trim(),
      });
    }

    if (query.semester !== undefined && !isNaN(Number(query.semester))) {
      qb.andWhere("(student.studentProfile->>'semester')::int = :sem", {
        sem: Number(query.semester),
      });
    }

    if (query.isActive !== undefined && query.isActive !== '') {
      qb.andWhere('student.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    qb.orderBy('student.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [students, total] = await qb.getManyAndCount();

    const activeCount = await this.userRepository.count({
      where: { isActive: true },
    });
    const pendingPasswordResetCount = await this.userRepository.count({
      where: { forcePasswordChange: true },
    });

    return {
      students: students.map((s) => {
        const { password, ...rest } = s;
        return { ...rest, _id: s.id };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total,
        active: activeCount,
        pendingPasswordChange: pendingPasswordResetCount,
      },
    };
  }

  async findById(id: string) {
    const student = await this.userRepository.findOne({
      where: [{ id }, { mongoId: id }],
    });
    if (!student) {
      throw new NotFoundException(`Student '${id}' not found`);
    }
    const { password, ...rest } = student;
    return { ...rest, _id: student.id };
  }

  async create(dto: CreateStudentDto, adminUser: any, ip = '', userAgent = '') {
    const formattedUid = dto.uid.toUpperCase().trim();
    const formattedEmail = dto.email.toLowerCase().trim();

    const existingUid = await this.userRepository.findOne({
      where: { uid: formattedUid },
    });
    if (existingUid) {
      throw new ConflictException(
        `Student with UID '${formattedUid}' already exists`,
      );
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: formattedEmail },
    });
    if (existingEmail) {
      throw new ConflictException(
        `User with email '${formattedEmail}' already exists`,
      );
    }

    const rawPassword = dto.password || this.generateSecurePassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const student = this.userRepository.create({
      name: dto.name.trim(),
      email: formattedEmail,
      uid: formattedUid,
      password: hashedPassword,
      role: 'student',
      isAssessmentStudent: true,
      forcePasswordChange:
        dto.forcePasswordChange !== undefined ? dto.forcePasswordChange : true,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      studentProfile: dto.studentProfile || {},
      authProvider: 'local',
    });
    await this.userRepository.save(student);

    // Audit log
    const audit = this.auditLogRepo.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email || 'admin',
      action: 'CREATE_STUDENT',
      target: student.id,
      targetType: 'User',
      studentId: student.id,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        uid: student.uid,
        email: student.email,
        name: student.name,
      },
    });
    await this.auditLogRepo.save(audit);

    const { password, ...studentJson } = student;
    return {
      student: { ...studentJson, _id: student.id },
      generatedPassword: !dto.password ? rawPassword : null,
    };
  }

  async update(
    id: string,
    dto: UpdateStudentDto,
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    const student = await this.userRepository.findOne({
      where: [{ id }, { mongoId: id }],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (dto.uid) {
      const formattedUid = dto.uid.toUpperCase().trim();
      if (formattedUid !== student.uid) {
        const existing = await this.userRepository.findOne({
          where: { uid: formattedUid },
        });
        if (existing && existing.id !== student.id) {
          throw new ConflictException(
            `UID '${formattedUid}' is already in use by another user`,
          );
        }
        student.uid = formattedUid;
      }
    }

    if (dto.email) {
      const formattedEmail = dto.email.toLowerCase().trim();
      if (formattedEmail !== student.email) {
        const existing = await this.userRepository.findOne({
          where: { email: formattedEmail },
        });
        if (existing && existing.id !== student.id) {
          throw new ConflictException(
            `Email '${formattedEmail}' is already in use by another user`,
          );
        }
        student.email = formattedEmail;
      }
    }

    if (dto.name !== undefined) student.name = dto.name.trim();
    if (dto.isActive !== undefined) student.isActive = dto.isActive;
    if (dto.forcePasswordChange !== undefined)
      student.forcePasswordChange = dto.forcePasswordChange;

    if (dto.studentProfile) {
      student.studentProfile = {
        ...(student.studentProfile || {}),
        ...dto.studentProfile,
      };
    }

    await this.userRepository.save(student);

    const audit = this.auditLogRepo.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email || 'admin',
      action: 'UPDATE_STUDENT',
      target: student.id,
      targetType: 'User',
      studentId: student.id,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        uid: student.uid,
        email: student.email,
        updates: dto,
      },
    });
    await this.auditLogRepo.save(audit);

    const { password, ...studentJson } = student;
    return { ...studentJson, _id: student.id };
  }

  async setActiveStatus(
    id: string,
    isActive: boolean,
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    const student = await this.userRepository.findOne({
      where: [{ id }, { mongoId: id }],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    student.isActive = isActive;
    await this.userRepository.save(student);

    const audit = this.auditLogRepo.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email || 'admin',
      action: isActive ? 'ACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT',
      target: student.id,
      targetType: 'User',
      studentId: student.id,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        uid: student.uid,
        email: student.email,
        isActive,
      },
    });
    await this.auditLogRepo.save(audit);

    return {
      message: `Student successfully ${isActive ? 'activated' : 'deactivated'}`,
      studentId: student.id,
      isActive: student.isActive,
    };
  }

  async resetPassword(id: string, adminUser: any, ip = '', userAgent = '') {
    const student = await this.userRepository.findOne({
      where: [{ id }, { mongoId: id }],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const tempPassword = this.generateSecurePassword(10);
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(tempPassword, salt);
    student.forcePasswordChange = true;
    await this.userRepository.save(student);

    const audit = this.auditLogRepo.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email || 'admin',
      action: 'RESET_PASSWORD',
      target: student.id,
      targetType: 'User',
      studentId: student.id,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        uid: student.uid,
        email: student.email,
        forcePasswordChange: true,
      },
    });
    await this.auditLogRepo.save(audit);

    return {
      message: 'Student password successfully reset',
      temporaryPassword: tempPassword,
      uid: student.uid,
      email: student.email,
      name: student.name,
    };
  }

  async parseAndValidateImport(fileBuffer: Buffer) {
    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    } catch (e: any) {
      throw new BadRequestException(
        'Unable to parse spreadsheet file: ' + e.message,
      );
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException(
        'The uploaded spreadsheet contains no sheets',
      );
    }

    const rawRows = xlsx.utils.sheet_to_json<Record<string, any>>(
      workbook.Sheets[firstSheetName],
      { defval: '' },
    );

    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestException('Uploaded sheet is empty');
    }

    const findField = (row: Record<string, any>, aliases: string[]): string => {
      const rowKeys = Object.keys(row);
      for (const alias of aliases) {
        const foundKey = rowKeys.find(
          (k) => k.trim().toLowerCase() === alias.toLowerCase(),
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const parsedRows: any[] = [];
    const fileUidMap = new Set<string>();
    const fileEmailMap = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const uid = findField(row, [
        'uid',
        'roll_no',
        'rollno',
        'roll number',
        'student_id',
        'studentid',
        'registration_no',
        'reg_no',
        'id',
      ]).toUpperCase();

      const name = findField(row, [
        'name',
        'student_name',
        'student name',
        'full_name',
        'fullname',
      ]);

      const email = findField(row, [
        'email',
        'student_email',
        'student email',
        'email_address',
        'mail',
      ]).toLowerCase();

      const department = findField(row, ['department', 'dept', 'branch']);
      const course = findField(row, ['course', 'degree', 'program']);
      const batch = findField(row, ['batch', 'year_of_study']);
      const section = findField(row, ['section', 'sec']);
      const group = findField(row, ['group', 'grp']);
      const university = findField(row, [
        'university',
        'college',
        'institution',
      ]);

      const rawSem = findField(row, ['semester', 'sem']);
      const semester = rawSem ? Number(rawSem) : 1;

      const rawYear = findField(row, ['year', 'grad_year', 'graduation_year']);
      const year = rawYear ? Number(rawYear) : NaN;

      const password = findField(row, [
        'password',
        'temp_password',
        'temporary_password',
        'pass',
      ]);

      parsedRows.push({
        rowNumber: i + 2,
        uid,
        name,
        email,
        department,
        course,
        batch,
        section,
        group,
        university,
        semester,
        year,
        password: password || undefined,
      });
    }

    const allFileUids = parsedRows.map((r) => r.uid).filter(Boolean);
    const allFileEmails = parsedRows.map((r) => r.email).filter(Boolean);

    const [existingUsersByUid, existingUsersByEmail] = await Promise.all([
      allFileUids.length > 0
        ? this.userRepository.find({
            where: { uid: In(allFileUids) },
            select: { uid: true },
          })
        : [],
      allFileEmails.length > 0
        ? this.userRepository.find({
            where: { email: In(allFileEmails) },
            select: { email: true },
          })
        : [],
    ]);

    const existingUidSet = new Set(existingUsersByUid.map((u) => u.uid));
    const existingEmailSet = new Set(
      existingUsersByEmail.map((u) => u.email.toLowerCase()),
    );

    const emailRegex = /^\S+@\S+\.\S+$/;
    const errors: {
      row: number;
      uid?: string;
      email?: string;
      error: string;
    }[] = [];
    const validRows: any[] = [];
    let duplicates = 0;
    let invalid = 0;

    for (const row of parsedRows) {
      const rowErrors: string[] = [];

      if (!row.uid) {
        rowErrors.push('UID is missing');
      } else if (fileUidMap.has(row.uid)) {
        rowErrors.push(`Duplicate UID '${row.uid}' within the uploaded file`);
      } else if (existingUidSet.has(row.uid)) {
        rowErrors.push(`UID '${row.uid}' already exists in database`);
      }

      if (!row.name) {
        rowErrors.push('Student name is missing');
      }

      if (!row.batch) {
        rowErrors.push('Batch/class is missing');
      }

      if (!Number.isInteger(row.year) || row.year < 1990 || row.year > 2100) {
        rowErrors.push('Year is missing or invalid');
      }

      if (
        !Number.isInteger(row.semester) ||
        row.semester < 1 ||
        row.semester > 12
      ) {
        rowErrors.push('Semester must be a number between 1 and 12');
      }

      if (!row.email) {
        rowErrors.push('Email is missing');
      } else if (!emailRegex.test(row.email)) {
        rowErrors.push(`Invalid email format '${row.email}'`);
      } else if (fileEmailMap.has(row.email)) {
        rowErrors.push(
          `Duplicate email '${row.email}' within the uploaded file`,
        );
      } else if (existingEmailSet.has(row.email)) {
        rowErrors.push(`Email '${row.email}' already exists in database`);
      }

      if (row.uid) fileUidMap.add(row.uid);
      if (row.email) fileEmailMap.add(row.email);

      if (rowErrors.length > 0) {
        const isDuplicate = rowErrors.some(
          (e) => e.includes('already exists') || e.includes('Duplicate'),
        );
        if (isDuplicate) duplicates++;
        else invalid++;

        errors.push({
          row: row.rowNumber,
          uid: row.uid,
          email: row.email,
          error: rowErrors.join('; '),
        });
      } else {
        validRows.push(row);
      }
    }

    return {
      total: parsedRows.length,
      valid: validRows.length,
      invalid,
      duplicates,
      errors,
      previewRows: parsedRows.slice(0, 50),
      validRows,
    };
  }

  async confirmImport(
    validRows: any[],
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    if (!validRows || validRows.length === 0) {
      throw new BadRequestException('No valid rows provided for import');
    }

    const uids = validRows.map((r) => String(r.uid || '').toUpperCase());
    const emails = validRows.map((r) => String(r.email || '').toLowerCase());

    const [dupUids, dupEmails] = await Promise.all([
      this.userRepository.find({ where: { uid: In(uids) }, select: { uid: true } }),
      this.userRepository.find({ where: { email: In(emails) }, select: { email: true } }),
    ]);

    if (dupUids.length || dupEmails.length) {
      throw new ConflictException(
        'Some students already exist; please re-upload the file for validation',
      );
    }
    if (
      new Set(uids).size !== uids.length ||
      new Set(emails).size !== emails.length
    ) {
      throw new BadRequestException('Duplicate UIDs or emails in import data');
    }

    const salt = await bcrypt.genSalt(10);
    const usersToInsert: User[] = [];
    const emailJobsToInsert: EmailJob[] = [];

    for (const row of validRows) {
      const rawPassword =
        row.password && String(row.password).trim()
          ? String(row.password).trim()
          : crypto.randomBytes(9).toString('base64url');
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      const u = this.userRepository.create({
        name: row.name,
        email: row.email,
        uid: row.uid,
        password: hashedPassword,
        role: 'student',
        isAssessmentStudent: true,
        forcePasswordChange: true,
        isActive: true,
        authProvider: 'local',
        studentProfile: {
          university: row.university || '',
          department: row.department || '',
          course: row.course || '',
          semester: row.semester || 1,
          section: row.section || '',
          group: row.group || '',
          batch: row.batch || '',
          year: row.year || new Date().getFullYear(),
        },
      });
      usersToInsert.push(u);

      const job = this.emailJobRepo.create({
        uid: row.uid,
        email: row.email,
        name: row.name,
        temporaryPassword: rawPassword,
        status: 'pending',
        retryCount: 0,
        createdBy: adminUser?.id || adminUser?._id,
      });
      emailJobsToInsert.push(job);
    }

    const chunkSize = 500;
    for (let i = 0; i < usersToInsert.length; i += chunkSize) {
      const chunk = usersToInsert.slice(i, i + chunkSize);
      await this.userRepository.save(chunk);
    }

    for (let i = 0; i < emailJobsToInsert.length; i += chunkSize) {
      const chunk = emailJobsToInsert.slice(i, i + chunkSize);
      await this.emailJobRepo.save(chunk);
    }

    const audit = this.auditLogRepo.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email || 'admin',
      action: 'IMPORT_STUDENTS',
      targetType: 'User',
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        importedCount: usersToInsert.length,
        emailJobsCreated: emailJobsToInsert.length,
      },
    });
    await this.auditLogRepo.save(audit);

    return {
      message: `Successfully imported ${usersToInsert.length} students.`,
      importedCount: usersToInsert.length,
      emailJobsCreated: emailJobsToInsert.length,
    };
  }

  async sendCredentials(jobIds?: string[], portalUrl?: string) {
    const where: any = jobIds && jobIds.length > 0 ? { id: In(jobIds) } : { status: 'pending' };

    const pendingJobs = await this.emailJobRepo.find({ where });
    if (!pendingJobs || pendingJobs.length === 0) {
      return {
        enqueuedCount: 0,
        message: 'No eligible credential email jobs found.',
      };
    }

    for (const job of pendingJobs) {
      job.status = 'queued';
      await this.emailJobRepo.save(job);

      await this.credentialEmailQueue.add(
        'send-credential',
        {
          emailJobId: job.id,
          portalUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
        },
      );
    }

    return {
      enqueuedCount: pendingJobs.length,
      message: `Enqueued ${pendingJobs.length} credential emails for delivery.`,
    };
  }

  async sendIndividualCredential(studentId: string, portalUrl?: string) {
    const student = await this.userRepository.findOne({
      where: [{ id: studentId }, { mongoId: studentId }],
    });
    if (!student) throw new NotFoundException('Student not found');

    let emailJob = await this.emailJobRepo.findOne({
      where: { uid: student.uid },
      order: { createdAt: 'DESC' },
    });

    if (!emailJob || !emailJob.temporaryPassword) {
      const tempPass = this.generateSecurePassword(10);
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(tempPass, salt);
      student.forcePasswordChange = true;
      await this.userRepository.save(student);

      emailJob = this.emailJobRepo.create({
        student: { id: student.id } as any,
        uid: student.uid,
        email: student.email,
        name: student.name,
        temporaryPassword: tempPass,
        status: 'queued',
        retryCount: 0,
      });
      await this.emailJobRepo.save(emailJob);
    } else {
      emailJob.status = 'queued';
      await this.emailJobRepo.save(emailJob);
    }

    await this.credentialEmailQueue.add(
      'send-credential',
      {
        emailJobId: emailJob.id,
        portalUrl,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      success: true,
      message: `Credential email enqueued for ${student.name} (${student.uid})`,
      jobId: emailJob.id,
    };
  }

  async retryFailedCredentials(portalUrl?: string) {
    const failedJobs = await this.emailJobRepo.find({ where: { status: 'failed' } });
    if (!failedJobs || failedJobs.length === 0) {
      return {
        retriedCount: 0,
        message: 'No failed credential email jobs found.',
      };
    }

    for (const job of failedJobs) {
      job.status = 'queued';
      await this.emailJobRepo.save(job);

      await this.credentialEmailQueue.add(
        'send-credential',
        {
          emailJobId: job.id,
          portalUrl,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    }

    return {
      retriedCount: failedJobs.length,
      message: `Re-enqueued ${failedJobs.length} failed credential emails for processing.`,
    };
  }

  async getEmailStatus(page = 1, limit = 20, status?: string) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where: any = status && status !== 'all' ? { status } : {};

    const [
      total,
      pending,
      queued,
      sent,
      failed,
      retrying,
      jobs,
      filteredTotal,
    ] = await Promise.all([
      this.emailJobRepo.count(),
      this.emailJobRepo.count({ where: { status: 'pending' } }),
      this.emailJobRepo.count({ where: { status: 'queued' } }),
      this.emailJobRepo.count({ where: { status: 'sent' } }),
      this.emailJobRepo.count({ where: { status: 'failed' } }),
      this.emailJobRepo.count({ where: { status: 'retrying' } }),
      this.emailJobRepo.find({
        where,
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
        skip,
        take: limit,
      }),
      this.emailJobRepo.count({ where }),
    ]);

    return {
      stats: {
        total,
        pending,
        queued,
        sent,
        failed,
        retrying,
      },
      jobs: jobs.map((j) => ({ ...j, _id: j.id })),
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
      },
    };
  }
}
