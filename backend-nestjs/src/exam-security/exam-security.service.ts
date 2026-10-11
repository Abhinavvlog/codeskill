import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../database/entities/assessment.entity';
import { ExamSession } from '../database/entities/exam-session.entity';
import { ExamSecurityEvent } from '../database/entities/exam-security-event.entity';

@Injectable()
export class ExamSecurityService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(ExamSession)
    private readonly sessionRepo: Repository<ExamSession>,
    @InjectRepository(ExamSecurityEvent)
    private readonly eventRepo: Repository<ExamSecurityEvent>,
  ) {}

  async initSecureSession(
    assessmentId: string,
    candidateId: string,
    headers: any,
    clientBody: any,
  ) {
    if (!assessmentId) throw new BadRequestException('Invalid assessment ID');

    const assessment = await this.assessmentRepo.findOne({
      where: [{ id: assessmentId }, { mongoId: assessmentId }],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const security = (assessment as any).securityPolicy;
    const isSecureMode = security && security.secureExamMode !== 'DISABLED';

    const clientType = clientBody.isSEB ? 'SEB' : 'BROWSER';
    const clientVersion = clientBody.clientVersion || 'UNKNOWN';
    const configKey = clientBody.configKey;

    if (security?.requireSEB && clientType !== 'SEB') {
      throw new ForbiddenException(
        'This assessment requires Safe Exam Browser. Please launch via SEB.',
      );
    }

    if (security?.requireSEB && security.allowedSEBVersions?.length > 0) {
      if (!security.allowedSEBVersions.includes(clientVersion)) {
        throw new ForbiddenException(
          `Your Safe Exam Browser version (${clientVersion}) is not supported for this assessment. Please install an approved version.`,
        );
      }
    }

    let session = await this.sessionRepo.findOne({
      where: [
        { assessment: { id: assessment.id } as any, candidate: { id: candidateId } as any },
        { assessmentId: assessment.id, candidateId },
      ],
    });

    if (!session) {
      const expiresAt = new Date(
        Date.now() +
          (assessment.durationMinutes || 60) * 60 * 1000 +
          (security?.heartbeatGracePeriod || 60) * 1000,
      );
      session = this.sessionRepo.create({
        assessment: { id: assessment.id } as any,
        candidate: { id: candidateId } as any,
        assessmentId: assessment.id,
        candidateId,
        status: 'VERIFIED',
        secureMode: security?.secureExamMode || 'DISABLED',
        clientType,
        clientVersion,
        configKey,
        expiresAt,
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        violationCount: 0,
      });
      await this.sessionRepo.save(session);
    } else {
      if (['SUBMITTED', 'EXPIRED', 'TERMINATED'].includes(session.status)) {
        throw new ForbiddenException('Exam session has already ended.');
      }
      session.lastHeartbeatAt = new Date();
      await this.sessionRepo.save(session);
    }

    return {
      success: true,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      status: session.status,
      secureMode: session.secureMode,
      token: 'simulate-secure-token',
    };
  }

  async processHeartbeat(sessionId: string, candidateId: string) {
    const session = await this.sessionRepo.findOne({
      where: [{ id: sessionId }, { mongoId: sessionId }],
    });
    if (!session || (session.candidateId !== candidateId && (session as any).candidate?.id !== candidateId)) {
      throw new ForbiddenException('Invalid session');
    }

    if (['SUBMITTED', 'EXPIRED', 'TERMINATED'].includes(session.status)) {
      throw new ForbiddenException('Session ended');
    }

    session.lastHeartbeatAt = new Date();
    if (session.status === 'SUSPENDED') {
      session.status = 'ACTIVE';
    }

    await this.sessionRepo.save(session);
    return { success: true, status: session.status };
  }

  async reportViolation(
    sessionId: string,
    candidateId: string,
    eventType: string,
    metadata: any,
  ) {
    const session = await this.sessionRepo.findOne({
      where: [{ id: sessionId }, { mongoId: sessionId }],
    });
    if (!session || (session.candidateId !== candidateId && (session as any).candidate?.id !== candidateId)) {
      throw new ForbiddenException('Invalid session');
    }

    const assessment = await this.assessmentRepo.findOne({
      where: [{ id: session.assessmentId }, { mongoId: session.assessmentId }],
    });

    const severity = ['TAB_HIDDEN', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT'].includes(
      eventType,
    )
      ? 'WARNING'
      : 'CRITICAL';

    const event = this.eventRepo.create({
      session: { id: session.id } as any,
      candidate: { id: candidateId } as any,
      assessment: { id: session.assessmentId } as any,
      sessionId: session.id,
      candidateId,
      assessmentId: session.assessmentId,
      eventType,
      severity,
      metadata,
    });
    await this.eventRepo.save(event);

    session.violationCount = (session.violationCount || 0) + 1;
    const threshold = (assessment as any)?.securityPolicy?.violationThreshold || 3;

    if (session.violationCount >= threshold) {
      session.status = 'SUSPENDED';
      session.securityState = 'VIOLATED';
    }

    await this.sessionRepo.save(session);

    return {
      success: true,
      status: session.status,
      violations: session.violationCount,
    };
  }
}
