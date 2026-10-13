import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In, Not } from 'typeorm';
import { Question as QuestionEntity } from '../database/entities/question.entity';
import { QuestionBank as QuestionBankEntity } from '../database/entities/question-bank.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { AuditLog as AuditLogEntity } from '../database/entities/audit-log.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { CacheService } from '../redis/cache.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

export function computeQuestionFingerprint(questionText: string, topic = ''): string {
  const normalized = (questionText || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = Array.from(new Set(normalized.split(' ').filter((w) => w.length > 1))).sort();
  const rawKey = `${(topic || '').toLowerCase().trim()}:::${tokens.join('_')}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex').slice(0, 32);
}

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
    @InjectRepository(QuestionBankEntity)
    private readonly questionBankRepository: Repository<QuestionBankEntity>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    private readonly cacheService: CacheService,
  ) {}

  private normalizeCategories(categories: string[]): string[] {
    return [
      ...new Set(categories.map((category) => category.trim()).filter(Boolean)),
    ];
  }

  async findAll(query: QueryQuestionsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.questionRepository.createQueryBuilder('question')
      .leftJoinAndSelect('question.createdBy', 'createdBy')
      .leftJoinAndSelect('question.approvedBy', 'approvedBy');

    if (query.status && query.status !== 'all') {
      qb.andWhere('question.status = :status', { status: query.status });
    } else {
      qb.andWhere('question.status != :archived', { archived: 'archived' });
    }

    if (query.topic && query.topic.trim()) {
      qb.andWhere(
        "(question.topic = :topic OR (question.metadata->'categories') ? :topic)",
        { topic: query.topic.trim() },
      );
    }

    const questionType = query.questionType;
    if (questionType && questionType !== 'all') {
      const groups = [
        ['MCQ', 'single_choice'],
        ['MULTIPLE_CHOICE', 'multiple_choice'],
        ['TRUE_FALSE', 'true_false'],
        ['CODE_OUTPUT', 'code_output'],
        ['DSA', 'coding', 'algorithmic'],
      ];
      const types = groups.find((group) => group.includes(questionType)) || [
        questionType,
      ];
      qb.andWhere('question.questionType IN (:...questionTypes)', {
        questionTypes: types,
      });
    }

    if (query.subtopic && query.subtopic.trim()) {
      qb.andWhere('question.subtopic = :subtopic', { subtopic: query.subtopic.trim() });
    }

    if (query.difficulty && query.difficulty !== 'all') {
      qb.andWhere('question.difficulty = :difficulty', { difficulty: query.difficulty });
    }

    if (query.aiGenerated !== undefined && query.aiGenerated !== '') {
      qb.andWhere('question.aiGenerated = :aiGenerated', { aiGenerated: query.aiGenerated === 'true' });
    }

    if (query.search && query.search.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(new Brackets(qbInner => {
        qbInner.where('question.question ILIKE :search', { search })
               .orWhere('question.topic ILIKE :search', { search })
               .orWhere('question.subtopic ILIKE :search', { search })
               .orWhere(`EXISTS (SELECT 1 FROM unnest(question.tags) AS t WHERE t ILIKE :search)`);
      }));
    }

    const [questions, total] = await qb
      .orderBy('question.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    questions.forEach((q) => {
      if (q.questionType === 'TRUE_FALSE') {
        let isFalse = q.correctAnswer === 1;
        if (Array.isArray(q.options) && q.correctAnswer !== undefined) {
          const chosen = String(q.options[q.correctAnswer] || '').trim().toLowerCase();
          if (chosen === 'false') {
            isFalse = true;
          } else if (chosen === 'true') {
            isFalse = false;
          }
        }
        q.options = ['True', 'False'];
        q.correctAnswer = isFalse ? 1 : 0;
        q.correctAnswers = [q.correctAnswer];
      }
    });

    const pendingCount = await this.questionRepository.count({ where: { status: 'pending' } });
    const approvedCount = await this.questionRepository.count({ where: { status: 'approved' } });

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total,
        pending: pendingCount,
        approved: approvedCount,
      },
    };
  }

  async findById(id: string, isStudent = false) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      throw new BadRequestException('Invalid question ID');
    }

    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question || question.status === 'archived') {
      throw new NotFoundException('Question not found');
    }

    if (question.questionType === 'TRUE_FALSE') {
      let isFalse = question.correctAnswer === 1;
      if (Array.isArray(question.options) && question.correctAnswer !== undefined) {
        const chosen = String(question.options[question.correctAnswer] || '').trim().toLowerCase();
        if (chosen === 'false') {
          isFalse = true;
        } else if (chosen === 'true') {
          isFalse = false;
        }
      }
      question.options = ['True', 'False'];
      question.correctAnswer = isFalse ? 1 : 0;
      question.correctAnswers = [question.correctAnswer];
    }

    // Question Leakage Prevention: NEVER send answers or hidden data to students
    if (isStudent) {
      const {
        correctAnswer,
        correctAnswers,
        explanation,
        expectedOutput,
        referenceSolutions,
        metadata,
        ...studentSafeQuestion
      } = question as any;

      if (studentSafeQuestion.testCases) {
        studentSafeQuestion.testCases = studentSafeQuestion.testCases.filter(
          (tc: any) => !tc.isHidden,
        );
      }

      return studentSafeQuestion;
    }

    return question;
  }

  async create(
    dto: CreateQuestionDto,
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    const {
      options: rawOptions,
      categories,
      visibility,
      contestOnly,
      ...rest
    } = dto;
    const type = String(dto.questionType || 'single_choice');
    const isChoice = [
      'single_choice',
      'multiple_choice',
      'MCQ',
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
    ].includes(type);

    let options: string[] = [];
    let correctAnswers: number[] = dto.correctAnswers || [];
    let correctAnswer = dto.correctAnswer ?? 0;

    if (type === 'TRUE_FALSE') {
      const source =
        Array.isArray(rawOptions) && rawOptions.length > 0
          ? rawOptions
          : ['True', 'False'];

      if (source.length !== 2) {
        throw new BadRequestException(
          'True/False questions must contain exactly two options: True and False',
        );
      }

      const optTexts = source.map((o: any) =>
        (typeof o === 'string' ? o : o?.text || '').trim(),
      );
      const lowerTexts = optTexts.map((t) => t.toLowerCase());

      if (lowerTexts[0] === lowerTexts[1]) {
        throw new BadRequestException(
          'True/False questions cannot have duplicate options',
        );
      }

      if (
        !lowerTexts.includes('true') ||
        !lowerTexts.includes('false')
      ) {
        throw new BadRequestException(
          'True/False questions must contain True and False options',
        );
      }

      options = ['True', 'False'];

      let selectedAnswer: number | null = null;
      const flagged = source
        .map((o: any, i: number) => {
          if (typeof o === 'object' && o?.isCorrect) {
            return lowerTexts[i] === 'false' ? 1 : 0;
          }
          return -1;
        })
        .filter((i: number) => i >= 0);

      if (flagged.length > 1) {
        throw new BadRequestException(
          'True/False questions cannot have more than one correct answer',
        );
      } else if (flagged.length === 1) {
        selectedAnswer = flagged[0];
      }

      if (dto.correctAnswer !== undefined) {
        if (dto.correctAnswer !== 0 && dto.correctAnswer !== 1) {
          throw new BadRequestException(
            'correctAnswer for True/False must be 0 (True) or 1 (False)',
          );
        }
        selectedAnswer = dto.correctAnswer;
      }

      if (dto.correctAnswers !== undefined && dto.correctAnswers.length > 0) {
        if (dto.correctAnswers.length > 1) {
          throw new BadRequestException(
            'True/False questions cannot have more than one correct answer',
          );
        }
        if (dto.correctAnswers[0] !== 0 && dto.correctAnswers[0] !== 1) {
          throw new BadRequestException(
            'correctAnswers for True/False must contain 0 (True) or 1 (False)',
          );
        }
        selectedAnswer = dto.correctAnswers[0];
      }

      if (selectedAnswer === null) {
        selectedAnswer = 0;
      }

      correctAnswer = selectedAnswer;
      correctAnswers = [selectedAnswer];
    } else if (isChoice) {
      const source = Array.isArray(rawOptions) ? rawOptions : [];
      options = source.map((o: any) => (typeof o === 'string' ? o : o?.text || ''));
      const flagged = source
        .map((o: any, i: number) => (typeof o === 'object' && o?.isCorrect ? i : -1))
        .filter((i: number) => i >= 0);
      if (flagged.length > 0) {
        correctAnswers = flagged;
        correctAnswer = flagged[0];
      }
      if (options.length < 2 || options.some((o) => !o.trim())) {
        throw new BadRequestException(
          'Choice questions need at least 2 non-empty options',
        );
      }
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        throw new BadRequestException(
          `correctAnswer must be a valid zero-based index between 0 and ${options.length - 1}`,
        );
      }
    }

    if (!(dto.question || dto.title)) {
      throw new BadRequestException('Question text is required');
    }
    if (dto.marks !== undefined && dto.marks <= 0) {
      throw new BadRequestException('Marks must be greater than 0');
    }

    const status = dto.status ?? 'approved';
    const metadata = {
      ...(categories !== undefined
        ? { categories: this.normalizeCategories(categories) }
        : {}),
      ...(visibility !== undefined ? { visibility } : {}),
      ...(contestOnly !== undefined ? { contestOnly } : {}),
    };
    const isApproved = ['approved', 'active', 'published'].includes(status);
    const newQuestion = this.questionRepository.create({
      ...rest,
      ...(categories !== undefined
        ? {
            topic: this.normalizeCategories(categories)[0] || 'General',
          }
        : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      question: dto.question || dto.title,
      options,
      correctAnswer,
      correctAnswers,
      created_by_id: adminUser.id || adminUser._id,
      status,
      ...(isApproved
        ? {
            approved_by_id: adminUser.id || adminUser._id,
            approvedAt: new Date(),
          }
        : {}),
    } as any) as unknown as QuestionEntity;

    const question = await this.questionRepository.save(newQuestion);
    await this.cacheService.invalidatePrefix('problems:');

    const auditLog = this.auditLogRepository.create({
      actorId: adminUser.id || adminUser._id,
      actorEmail: adminUser.email,
      action: 'CREATE_QUESTION',
      target: question.id,
      targetType: 'Question',
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        topic: question.topic,
        difficulty: question.difficulty,
      },
    });
    await this.auditLogRepository.save(auditLog);

    return question;
  }

  async update(
    id: string,
    dto: UpdateQuestionDto,
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question || question.status === 'archived') {
      throw new NotFoundException('Question not found');
    }

    const type = String(dto.questionType || question.questionType || 'single_choice');
    const isChoice = [
      'single_choice',
      'multiple_choice',
      'MCQ',
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
    ].includes(type);

    if (type === 'TRUE_FALSE') {
      const rawOptions = dto.options !== undefined ? dto.options : question.options;
      const source =
        Array.isArray(rawOptions) && rawOptions.length > 0
          ? rawOptions
          : ['True', 'False'];

      if (source.length !== 2) {
        throw new BadRequestException(
          'True/False questions must contain exactly two options: True and False',
        );
      }

      const optTexts = source.map((o: any) =>
        (typeof o === 'string' ? o : o?.text || '').trim(),
      );
      const lowerTexts = optTexts.map((t) => t.toLowerCase());

      if (lowerTexts[0] === lowerTexts[1]) {
        throw new BadRequestException(
          'True/False questions cannot have duplicate options',
        );
      }

      if (
        !lowerTexts.includes('true') ||
        !lowerTexts.includes('false')
      ) {
        throw new BadRequestException(
          'True/False questions must contain True and False options',
        );
      }

      dto.options = ['True', 'False'];

      let selectedAnswer: number | null = null;
      if (dto.options !== undefined && Array.isArray(rawOptions)) {
        const flagged = rawOptions
          .map((o: any, i: number) => {
            if (typeof o === 'object' && o?.isCorrect) {
              return lowerTexts[i] === 'false' ? 1 : 0;
            }
            return -1;
          })
          .filter((i: number) => i >= 0);

        if (flagged.length > 1) {
          throw new BadRequestException(
            'True/False questions cannot have more than one correct answer',
          );
        } else if (flagged.length === 1) {
          selectedAnswer = flagged[0];
        }
      }

      if (dto.correctAnswer !== undefined) {
        if (dto.correctAnswer !== 0 && dto.correctAnswer !== 1) {
          throw new BadRequestException(
            'correctAnswer for True/False must be 0 (True) or 1 (False)',
          );
        }
        selectedAnswer = dto.correctAnswer;
      }

      if (dto.correctAnswers !== undefined && dto.correctAnswers.length > 0) {
        if (dto.correctAnswers.length > 1) {
          throw new BadRequestException(
            'True/False questions cannot have more than one correct answer',
          );
        }
        if (dto.correctAnswers[0] !== 0 && dto.correctAnswers[0] !== 1) {
          throw new BadRequestException(
            'correctAnswers for True/False must contain 0 (True) or 1 (False)',
          );
        }
        selectedAnswer = dto.correctAnswers[0];
      }

      if (selectedAnswer !== null) {
        dto.correctAnswer = selectedAnswer;
        dto.correctAnswers = [selectedAnswer];
      } else {
        const existingAns = question.correctAnswer === 1 ? 1 : 0;
        dto.correctAnswer = existingAns;
        dto.correctAnswers = [existingAns];
      }
    } else if (isChoice) {
      if (dto.options !== undefined) {
        const rawOptions = dto.options;
        const source = Array.isArray(rawOptions) ? rawOptions : [];
        const options = source.map((o: any) =>
          typeof o === 'string' ? o : o?.text || '',
        );
        const flagged = source
          .map((o: any, i: number) => (typeof o === 'object' && o?.isCorrect ? i : -1))
          .filter((i: number) => i >= 0);

        if (flagged.length > 0 && dto.correctAnswer === undefined) {
          dto.correctAnswers = flagged;
          dto.correctAnswer = flagged[0];
        }

        if (options.length < 2 || options.some((o) => !o.trim())) {
          throw new BadRequestException(
            'Choice questions need at least 2 non-empty options',
          );
        }

        const effectiveCorrectAnswer =
          dto.correctAnswer !== undefined ? dto.correctAnswer : question.correctAnswer;
        if (
          effectiveCorrectAnswer !== undefined &&
          (effectiveCorrectAnswer < 0 || effectiveCorrectAnswer >= options.length)
        ) {
          throw new BadRequestException(
            `correctAnswer must be a valid zero-based index between 0 and ${options.length - 1}`,
          );
        }
        dto.options = options;
      } else if (dto.correctAnswer !== undefined) {
        const currentOptions = question.options || [];
        if (
          currentOptions.length > 0 &&
          (dto.correctAnswer < 0 || dto.correctAnswer >= currentOptions.length)
        ) {
          throw new BadRequestException(
            `correctAnswer must be a valid index between 0 and ${currentOptions.length - 1}`,
          );
        }
      }
    }

    if (dto.title && !dto.question) {
      dto.question = dto.title;
    }

    const { categories, visibility, contestOnly, ...updates } = dto;
    const existingCategories: unknown = question.metadata?.categories;
    if (categories !== undefined) {
      const topics = this.normalizeCategories(categories);
      question.metadata = { ...question.metadata, categories: topics };
      updates.topic = topics[0] || 'General';
    } else if (
      updates.topic !== undefined &&
      Array.isArray(existingCategories)
    ) {
      question.metadata = {
        ...question.metadata,
        categories: this.normalizeCategories([
          updates.topic,
          ...existingCategories
            .slice(1)
            .filter(
              (category: unknown): category is string =>
                typeof category === 'string',
            ),
        ]),
      };
    }
    if (visibility !== undefined) {
      question.metadata = { ...question.metadata, visibility };
    }
    if (contestOnly !== undefined) {
      question.metadata = { ...question.metadata, contestOnly };
    }
    Object.assign(question, updates);
    await this.questionRepository.save(question);
    await this.cacheService.invalidatePrefix('problems:');

    const auditLog = this.auditLogRepository.create({
      actorId: adminUser.id || adminUser._id,
      actorEmail: adminUser.email,
      action: 'UPDATE_QUESTION',
      target: question.id,
      targetType: 'Question',
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { updates: dto },
    });
    await this.auditLogRepository.save(auditLog);

    return question;
  }

  async delete(id: string, adminUser: any, ip = '', userAgent = '') {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    // Check if referenced in assessments
    const allAssessments = await this.assessmentRepository.find({
      select: { id: true, title: true, questions: true },
    });
    const referencingAssessments = allAssessments.filter(
      (a) => Array.isArray(a.questions) && a.questions.includes(id),
    );

    question.status = 'archived';
    await this.questionRepository.save(question);
    await this.cacheService.invalidatePrefix('problems:');

    const auditLog = this.auditLogRepository.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email,
      action: 'DELETE_QUESTION',
      target: question.id,
      targetType: 'Question',
      metadata: {
        referencingAssessmentsCount: referencingAssessments.length,
        assessmentTitles: referencingAssessments.map((a) => a.title),
      },
      ipAddress: ip,
      userAgent: userAgent,
    });
    await this.auditLogRepository.save(auditLog);

    return {
      success: true,
      message:
        referencingAssessments.length > 0
          ? `Question archived safely. Preserved in ${referencingAssessments.length} assessment(s) for historical integrity.`
          : 'Question successfully archived.',
      referencedAssessments: referencingAssessments.map((a) => ({
        id: a.id,
        title: a.title,
      })),
    };
  }

  async scanDuplicates() {
    const questions = await this.questionRepository.find({
      where: { status: Not('archived') },
      select: {
        id: true,
        title: true,
        question: true,
        topic: true,
        difficulty: true,
        marks: true,
        questionType: true,
        fingerprint: true,
        createdAt: true,
      },
    });

    const groups: Map<string, any[]> = new Map();
    for (const q of questions) {
      const fp = q.fingerprint || computeQuestionFingerprint(q.question, q.topic);
      if (!groups.has(fp)) groups.set(fp, []);
      groups.get(fp)!.push(q);
    }

    const allAssessments = await this.assessmentRepository.find({
      select: { id: true, title: true, questions: true },
    });

    const duplicateGroups: Array<{
      fingerprint: string;
      primaryQuestion: any;
      duplicateQuestions: any[];
      totalCount: number;
      assessmentsReferenced: Array<{ assessmentId: string; title: string }>;
    }> = [];

    for (const [fp, list] of groups.entries()) {
      if (list.length > 1) {
        list.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const primary = list[0];
        const duplicates = list.slice(1);
        const allIds = new Set(list.map((q) => q.id));

        const referenced = allAssessments
          .filter(
            (a) => Array.isArray(a.questions) && a.questions.some((qId) => allIds.has(qId)),
          )
          .map((a) => ({ assessmentId: a.id, title: a.title }));

        duplicateGroups.push({
          fingerprint: fp,
          primaryQuestion: primary,
          duplicateQuestions: duplicates,
          totalCount: list.length,
          assessmentsReferenced: referenced,
        });
      }
    }

    return {
      success: true,
      totalDuplicates: duplicateGroups.reduce(
        (acc, g) => acc + g.duplicateQuestions.length,
        0,
      ),
      totalGroups: duplicateGroups.length,
      groups: duplicateGroups,
    };
  }

  async resolveDuplicates(
    primaryQuestionId: string,
    duplicateQuestionIds: string[],
    action: 'archive' | 'merge' = 'archive',
    adminUser: any,
  ) {
    if (!duplicateQuestionIds || duplicateQuestionIds.length === 0) {
      throw new BadRequestException('No duplicate question IDs provided');
    }

    const primary = await this.questionRepository.findOne({
      where: { id: primaryQuestionId },
    });
    if (!primary) throw new NotFoundException('Primary question not found');

    const duplicates = await this.questionRepository.find({
      where: { id: In(duplicateQuestionIds) },
    });

    let updatedAssessmentsCount = 0;
    if (action === 'merge') {
      const assessments = await this.assessmentRepository.find();
      for (const assessment of assessments) {
        if (Array.isArray(assessment.questions)) {
          let hasChange = false;
          const newQuestions = assessment.questions.map((qId) => {
            if (duplicateQuestionIds.includes(qId)) {
              hasChange = true;
              return primaryQuestionId;
            }
            return qId;
          });
          if (hasChange) {
            assessment.questions = [...new Set(newQuestions)];
            await this.assessmentRepository.save(assessment);
            updatedAssessmentsCount++;
          }
        }
      }
    }

    for (const dup of duplicates) {
      dup.status = 'archived';
      await this.questionRepository.save(dup);
    }

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        actorId: adminUser?.id || adminUser?._id,
        actorEmail: adminUser?.email,
        action: 'RESOLVE_DUPLICATE_QUESTIONS',
        target: primaryQuestionId,
        targetType: 'Question',
        metadata: {
          action,
          duplicateCount: duplicates.length,
          updatedAssessmentsCount,
        },
      }),
    );

    return {
      success: true,
      message: `Successfully resolved ${duplicates.length} duplicate questions via ${action}.`,
      archivedCount: duplicates.length,
      updatedAssessmentsCount,
    };
  }

  async review(
    id: string,
    status: 'approved' | 'rejected',
    reason = '',
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    question.status = status;
    if (status === 'approved') {
      question.approved_by_id = adminUser.id || adminUser._id;
      question.approvedAt = new Date();
      question.rejectedReason = undefined;
    } else {
      question.rejectedReason =
        reason || 'Declined during administrative review';
    }

    await this.questionRepository.save(question);
    await this.cacheService.invalidatePrefix('problems:');

    const auditLog = this.auditLogRepository.create({
      actorId: adminUser.id || adminUser._id,
      actorEmail: adminUser.email,
      action: status === 'approved' ? 'APPROVE_QUESTION' : 'REJECT_QUESTION',
      target: question.id,
      targetType: 'Question',
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { reason },
    });
    await this.auditLogRepository.save(auditLog);

    return question;
  }

  async getTopicsDistribution() {
    const query = await this.questionRepository.query(`
      SELECT 
        category as topic,
        COUNT(*) as total,
        SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) as easy,
        SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) as hard,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM questions
      CROSS JOIN LATERAL (
        SELECT DISTINCT value AS category
        FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(metadata->'categories') = 'array' AND metadata->'categories' <> '[]'::jsonb
            THEN metadata->'categories'
            ELSE jsonb_build_array(COALESCE(topic, 'Unassigned'))
          END
        )
      ) AS categories
      WHERE status != 'archived'
      GROUP BY category
      ORDER BY total DESC
    `);

    return query.map((t: any) => ({
      topic: t.topic,
      total: Number(t.total) || 0,
      easy: Number(t.easy) || 0,
      medium: Number(t.medium) || 0,
      hard: Number(t.hard) || 0,
      approved: Number(t.approved) || 0,
      pending: Number(t.pending) || 0,
    }));
  }

  // --- Question Bank Collection Methods ---

  async findAllBanks(topic?: string) {
    const qb = this.questionBankRepository.createQueryBuilder('bank')
      .leftJoinAndSelect('bank.createdBy', 'createdBy');
    
    if (topic) {
      qb.where('bank.topic = :topic', { topic });
    }

    const banks = await qb.orderBy('bank.createdAt', 'DESC').getMany();

    // Map questions for frontend if we were populated before
    for (const bank of banks) {
      if (bank.questions && bank.questions.length > 0) {
        const qEntities = await this.questionRepository.find({
          where: { id: In(bank.questions) },
          select: { id: true, question: true, topic: true, difficulty: true, marks: true, options: true }
        });
        (bank as any).questions = qEntities;
      }
    }

    return banks;
  }

  async findBankById(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) throw new BadRequestException('Invalid ID');

    const bank = await this.questionBankRepository.findOne({
      where: { id },
      relations: { createdBy: true }
    });

    if (!bank) throw new NotFoundException('Question Bank not found');

    if (bank.questions && bank.questions.length > 0) {
      const qEntities = await this.questionRepository.find({
        where: { id: In(bank.questions) },
      });
      (bank as any).questions = qEntities;
    }

    return bank;
  }

  async createBank(dto: CreateQuestionBankDto, adminUser: any) {
    const bank = this.questionBankRepository.create({
      ...dto,
      questions: dto.questions || [],
      createdBy_id: adminUser.id || adminUser._id,
    });
    return this.questionBankRepository.save(bank);
  }

  async updateBank(id: string, dto: Partial<CreateQuestionBankDto>) {
    const bank = await this.questionBankRepository.findOne({ where: { id } });
    if (!bank) throw new NotFoundException('Question Bank not found');

    if (dto.questions) bank.questions = dto.questions;
    if (dto.name) bank.name = dto.name;
    if (dto.description !== undefined) bank.description = dto.description;
    if (dto.topic) bank.topic = dto.topic;
    if (dto.isPublic !== undefined) bank.isPublic = dto.isPublic;
    if (dto.tags) bank.tags = dto.tags;

    return this.questionBankRepository.save(bank);
  }

  async deleteBank(id: string) {
    const res = await this.questionBankRepository.delete(id);
    if (res.affected === 0) throw new NotFoundException('Question Bank not found');
    return { success: true, message: 'Question Bank removed' };
  }

  // --- Bulk Question Import (XLSX / CSV) ---

  async parseAndValidateQuestionsImport(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException(
        'The uploaded spreadsheet contains no sheets.',
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestException(
        'The uploaded spreadsheet contains no data rows.',
      );
    }

    const normalizeHeader = (str: string) =>
      str.toLowerCase().replace(/[\s\-_.]/g, '');

    const findField = (row: any, aliases: string[]) => {
      const keys = Object.keys(row);
      const normalizedAliases = aliases.map(normalizeHeader);
      for (const key of keys) {
        if (normalizedAliases.includes(normalizeHeader(key))) {
          const val = row[key];
          return typeof val === 'string' ? val.trim() : String(val).trim();
        }
      }
      return '';
    };

    const parsedRows: any[] = [];
    const fileQuestionSet = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const questionId = findField(row, [
        'question_id',
        'questionid',
        'qid',
        'id',
      ]);
      const title = findField(row, ['title', 'problem_title', 'name']);
      const slug = findField(row, ['slug', 'problem_slug']);
      const problemStatement = findField(row, [
        'problem_statement',
        'problemstatement',
        'question_statement',
        'question_text',
        'statement',
        'description',
      ]);
      const genericQuestion = findField(row, [
        'question',
        'problem',
      ]);
      const question = problemStatement || genericQuestion || title;

      const rawQuestionType =
        findField(row, ['question_type', 'questiontype', 'type', 'qtype']) || 'single_choice';
      const topic =
        findField(row, ['topic', 'subject', 'category']) || 'General';
      const subtopic = findField(row, ['subtopic', 'sub_topic', 'chapter']);
      const difficulty = (
        findField(row, ['difficulty', 'level']) || 'medium'
      ).toLowerCase();

      const rawMarks = findField(row, ['marks', 'mark', 'score', 'points']);
      const marks = rawMarks ? Number(rawMarks) : 1;

      const rawNeg = findField(row, [
        'negative_marks',
        'negative_mark',
        'negativemarks',
        'negative',
        'penalty',
      ]);
      const negativeMarks = rawNeg ? Number(rawNeg) : 0;

      const optA = findField(row, [
        'option_a',
        'optiona',
        'option_1',
        'opt_a',
        'a',
      ]);
      const optB = findField(row, [
        'option_b',
        'optionb',
        'option_2',
        'opt_b',
        'b',
      ]);
      const optC = findField(row, [
        'option_c',
        'optionc',
        'option_3',
        'opt_c',
        'c',
      ]);
      const optD = findField(row, [
        'option_d',
        'optiond',
        'option_4',
        'opt_d',
        'd',
      ]);
      const optE = findField(row, [
        'option_e',
        'optione',
        'option_5',
        'opt_e',
        'e',
      ]);

      const correctAnswerRaw = findField(row, [
        'correct_answer',
        'correct',
        'answer',
        'key',
        'ans',
      ]);
      const explanation = findField(row, [
        'explanation',
        'solution',
        'rationale',
        'sample_explanation',
      ]);
      const codeSnippet = findField(row, [
        'code_snippet',
        'code',
        'snippet',
        'starter_code',
        'startercode',
      ]);
      const rawLanguage = findField(row, ['language', 'lang']) || 'general';
      const language = ['na', 'n/a', 'none', 'all', ''].includes(
        rawLanguage.toLowerCase().trim(),
      )
        ? 'general'
        : rawLanguage;

      const rawTags = findField(row, ['tags', 'tag']);
      const tags = rawTags
        ? rawTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Algorithmic / Structured Coding fields
      const constraints = findField(row, [
        'constraints',
        'constraint',
        'limits',
      ]);
      const inputFormat = findField(row, ['input_format', 'inputformat']);
      const outputFormat = findField(row, ['output_format', 'outputformat']);
      const sampleInput = findField(row, ['sample_input', 'sampleinput', 'example_input']);
      const sampleOutput = findField(row, ['sample_output', 'sampleoutput', 'example_output']);
      const rawHints = findField(row, ['hints', 'hint']);
      const hints = rawHints
        ? rawHints
            .split(/[\n|;]/)
            .map((h: string) => h.trim())
            .filter(Boolean)
        : [];
      const approach = findField(row, ['approach', 'intuition', 'strategy']);
      const expectedTimeComplexity = findField(row, [
        'expected_time_complexity',
        'expectedtimecomplexity',
        'time_complexity',
      ]);
      const expectedSpaceComplexity = findField(row, [
        'expected_space_complexity',
        'expectedspacecomplexity',
        'space_complexity',
      ]);

      // Starter code for various languages
      const starterCode: Array<{ language: string; code: string }> = [];
      const starterC = findField(row, ['starter_code_c', 'startercode_c', 'starter_c']);
      if (starterC) starterCode.push({ language: 'c', code: starterC });
      const starterCpp = findField(row, ['starter_code_cpp', 'startercode_cpp', 'starter_cpp', 'starter_code_c++']);
      if (starterCpp) starterCode.push({ language: 'cpp', code: starterCpp });
      const starterJava = findField(row, ['starter_code_java', 'startercode_java', 'starter_java']);
      if (starterJava) starterCode.push({ language: 'java', code: starterJava });
      const starterPython = findField(row, ['starter_code_python', 'startercode_python', 'starter_python', 'starter_code_py']);
      if (starterPython) starterCode.push({ language: 'python', code: starterPython });
      const starterJs = findField(row, [
        'starter_code_javascript',
        'starter_code_js',
        'startercode_javascript',
        'starter_javascript',
        'starter_js',
      ]);
      if (starterJs) starterCode.push({ language: 'javascript', code: starterJs });
      const starterTs = findField(row, ['starter_code_typescript', 'starter_code_ts', 'startercode_typescript', 'starter_ts']);
      if (starterTs) starterCode.push({ language: 'typescript', code: starterTs });
      const starterGo = findField(row, ['starter_code_go', 'startercode_go', 'starter_go', 'starter_code_golang']);
      if (starterGo) starterCode.push({ language: 'go', code: starterGo });
      const starterRust = findField(row, ['starter_code_rust', 'startercode_rust', 'starter_rust', 'starter_code_rs']);
      if (starterRust) starterCode.push({ language: 'rust', code: starterRust });
      if (codeSnippet && starterCode.length === 0) {
        starterCode.push({ language: language !== 'general' ? language : 'python', code: codeSnippet });
      }

      // Solution code for various languages
      const referenceSolutions: Array<{ language: string; sourceCode: string }> = [];
      const solC = findField(row, ['solution_code_c', 'solutioncode_c', 'solution_c']);
      if (solC) referenceSolutions.push({ language: 'c', sourceCode: solC });
      const solCpp = findField(row, ['solution_code_cpp', 'solutioncode_cpp', 'solution_cpp', 'solution_code_c++']);
      if (solCpp) referenceSolutions.push({ language: 'cpp', sourceCode: solCpp });
      const solJava = findField(row, ['solution_code_java', 'solutioncode_java', 'solution_java']);
      if (solJava) referenceSolutions.push({ language: 'java', sourceCode: solJava });
      const solPython = findField(row, ['solution_code_python', 'solutioncode_python', 'solution_python', 'solution_code_py']);
      if (solPython) referenceSolutions.push({ language: 'python', sourceCode: solPython });
      const solJs = findField(row, [
        'solution_code_javascript',
        'solution_code_js',
        'solutioncode_javascript',
        'solution_javascript',
        'solution_js',
      ]);
      if (solJs) referenceSolutions.push({ language: 'javascript', sourceCode: solJs });
      const solGo = findField(row, ['solution_code_go', 'solutioncode_go', 'solution_go', 'solution_code_golang']);
      if (solGo) referenceSolutions.push({ language: 'go', sourceCode: solGo });
      const solRust = findField(row, ['solution_code_rust', 'solutioncode_rust', 'solution_rust', 'solution_code_rs']);
      if (solRust) referenceSolutions.push({ language: 'rust', sourceCode: solRust });

      // Supported languages
      const rawSupported = findField(row, ['supported_languages', 'supportedlanguages', 'languages']);
      const supportedLanguages = rawSupported
        ? rawSupported.split(/[,|]/).map((l: string) => l.trim()).filter(Boolean)
        : [
            ...new Set([
              ...starterCode.map((s) => s.language),
              ...referenceSolutions.map((s) => s.language),
            ]),
          ];

      // Time & Memory Limits
      const timeLimitRaw = findField(row, [
        'time_limit_ms',
        'timelimitms',
        'time_limit',
        'timelimit',
      ]);
      const timeLimit =
        timeLimitRaw && !isNaN(Number(timeLimitRaw))
          ? Number(timeLimitRaw)
          : 2000;
      const memoryLimitRaw = findField(row, [
        'memory_limit_mb',
        'memorylimitmb',
        'memory_limit',
        'memorylimit',
      ]);
      const memoryLimit =
        memoryLimitRaw && !isNaN(Number(memoryLimitRaw))
          ? Number(memoryLimitRaw)
          : 256;

      // Execution & Function specifics
      const executionMode =
        findField(row, ['execution_mode', 'executionmode', 'mode']) || 'standard';
      const entryPoint = findField(row, ['entry_point', 'entrypoint']) || 'main';
      const functionName = findField(row, ['function_name', 'functionname', 'fn_name']);
      const returnType = findField(row, ['return_type', 'returntype']);
      const inputType = findField(row, ['input_type', 'inputtype']);
      const outputType = findField(row, ['output_type', 'outputtype']);

      const rawAllowCustom = findField(row, ['allow_custom_input', 'allowcustominput']);
      const allowCustomInput =
        rawAllowCustom !== ''
          ? ['true', '1', 'yes'].includes(rawAllowCustom.toLowerCase().trim())
          : true;

      const compareMode =
        findField(row, ['compare_mode', 'comparemode']) || 'exact';

      const rawPartialScoring = findField(row, ['partial_scoring', 'partialscoring']);
      const partialScoring =
        rawPartialScoring !== ''
          ? ['true', '1', 'yes'].includes(rawPartialScoring.toLowerCase().trim())
          : false;

      const rawIsActive = findField(row, ['is_active', 'isactive', 'active', 'status']);
      const isActive =
        rawIsActive !== ''
          ? ['true', '1', 'yes', 'active', 'approved'].includes(
              rawIsActive.toLowerCase().trim(),
            )
          : true;

      const createdByAuthor = findField(row, ['created_by', 'createdby', 'author']);
      const version = findField(row, ['version', 'ver']) || '1.0';

      // Extract test cases (1 to 5 + support up to 10)
      const testCases: Array<{
        id: string;
        input: string;
        output: string;
        expectedOutput?: string;
        isHidden?: boolean;
        explanation?: string;
        weight?: number;
      }> = [];
      for (let tcIdx = 1; tcIdx <= 10; tcIdx++) {
        const inp = findField(row, [
          `test_input_${tcIdx}`,
          `testinput${tcIdx}`,
          `input_${tcIdx}`,
          `in_${tcIdx}`,
        ]);
        const out = findField(row, [
          `test_output_${tcIdx}`,
          `testoutput${tcIdx}`,
          `output_${tcIdx}`,
          `out_${tcIdx}`,
        ]);
        const vis = findField(row, [
          `test_visibility_${tcIdx}`,
          `testvisibility${tcIdx}`,
          `visibility_${tcIdx}`,
          `test_visibility${tcIdx}`,
        ]);

        if (inp || out) {
          let isHidden = tcIdx > 2;
          if (vis) {
            const v = vis.toLowerCase().trim();
            if (['hidden', 'private', 'false', '0', 'no'].includes(v)) {
              isHidden = true;
            } else if (['sample', 'public', 'visible', 'true', '1', 'yes'].includes(v)) {
              isHidden = false;
            }
          }
          testCases.push({
            id: String(tcIdx),
            input: inp,
            output: out,
            expectedOutput: out,
            isHidden,
            weight: 1,
          });
        }
      }

      // Sample Input and Output (Examples)
      const examples: Array<{ input: string; output: string; explanation?: string }> = [];
      if (sampleInput || sampleOutput) {
        examples.push({
          input: sampleInput,
          output: sampleOutput,
          explanation: explanation || undefined,
        });
        if (testCases.length === 0 && sampleOutput) {
          testCases.push({
            id: '1',
            input: sampleInput,
            output: sampleOutput,
            expectedOutput: sampleOutput,
            isHidden: false,
            weight: 1,
          });
        }
      }

      let testCaseJsonError = false;
      const rawTestCasesJson = findField(row, [
        'test_cases',
        'testcases',
        'testcase',
        'tests',
      ]);
      if (rawTestCasesJson) {
        try {
          const parsedTc = JSON.parse(rawTestCasesJson);
          if (Array.isArray(parsedTc)) {
            testCases.push(...parsedTc);
          } else {
            testCaseJsonError = true;
          }
        } catch (e) {
          testCaseJsonError = true;
        }
      }

      const typeKey = rawQuestionType.toLowerCase().replace(/[\s-]/g, '_');
      const TYPE_MAP: Record<string, string> = {
        single_choice: 'single_choice',
        mcq: 'single_choice',
        single: 'single_choice',
        multiple_choice: 'multiple_choice',
        multiple: 'multiple_choice',
        msq: 'multiple_choice',
        true_false: 'true_false',
        truefalse: 'true_false',
        tf: 'true_false',
        coding: 'coding',
        algorithmic: 'coding',
        algorithm: 'coding',
        code: 'coding',
        dsa: 'coding',
      };
      const mappedType = TYPE_MAP[typeKey];
      const isCoding =
        mappedType === 'coding' ||
        testCases.length > 0 ||
        starterCode.length > 0 ||
        referenceSolutions.length > 0 ||
        supportedLanguages.length > 0 ||
        !!functionName ||
        !!inputFormat ||
        !!outputFormat;
      const unknownType = !isCoding && !mappedType;

      // True/False is stored as a two-option single choice question
      const isTrueFalse = !isCoding && mappedType === 'true_false';
      const questionType = isCoding
        ? 'coding'
        : isTrueFalse
          ? 'single_choice'
          : mappedType || typeKey;

      parsedRows.push({
        rowNumber: i + 2,
        questionId,
        title: title || (question ? question.slice(0, 100) : 'Untitled Question'),
        slug,
        problemStatement: problemStatement || question,
        question,
        questionType,
        unknownType,
        rawQuestionType,
        testCaseJsonError,
        rawMarks,
        rawNeg,
        topic,
        subtopic,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty)
          ? difficulty
          : 'medium',
        marks,
        negativeMarks,
        optA: isTrueFalse ? 'True' : optA,
        optB: isTrueFalse ? 'False' : optB,
        optC: isTrueFalse ? '' : optC,
        optD: isTrueFalse ? '' : optD,
        optE: isTrueFalse ? '' : optE,
        correctAnswerRaw,
        explanation,
        codeSnippet,
        starterCode,
        referenceSolutions,
        supportedLanguages,
        examples,
        language,
        tags,
        constraints,
        inputFormat,
        outputFormat,
        hints,
        approach,
        expectedTimeComplexity,
        expectedSpaceComplexity,
        timeLimit,
        memoryLimit,
        executionMode,
        entryPoint,
        functionName,
        returnType,
        inputType,
        outputType,
        allowCustomInput,
        compareMode,
        partialScoring,
        isActive,
        createdByAuthor,
        version,
        testCases,
        isCoding,
      });
    }

    const allFileQuestions = parsedRows.map((r) => r.question).filter(Boolean);
    const allFileTitles = parsedRows.map((r) => r.title).filter(Boolean);
    const existingDbQuestions = await this.questionRepository.find({
      where: [
        { question: In(allFileQuestions) },
        ...(allFileTitles.length > 0 ? [{ title: In(allFileTitles) }] : []),
      ],
      select: { question: true, title: true, topic: true },
    });

    const dbQuestionMap = new Set(
      existingDbQuestions.flatMap((q) => [
        `${q.topic.toLowerCase()}:::${q.question.toLowerCase().trim()}`,
        ...(q.title
          ? [`${q.topic.toLowerCase()}:::${q.title.toLowerCase().trim()}`]
          : []),
      ]),
    );

    const errors: { row: number; question?: string; error: string }[] = [];
    const validRows: any[] = [];
    let duplicatesInFile = 0;
    let willUpdateCount = 0;
    let willInsertCount = 0;
    let invalid = 0;

    for (const row of parsedRows) {
      const rowErrors: string[] = [];

      if (!row.question) {
        rowErrors.push('Question statement is missing');
      } else {
        const questionKey = `${row.topic.toLowerCase()}:::${row.question.toLowerCase().trim()}`;
        if (fileQuestionSet.has(questionKey)) {
          rowErrors.push(
            'Duplicate question statement within the uploaded file',
          );
          duplicatesInFile++;
        } else {
          fileQuestionSet.add(questionKey);
          if (dbQuestionMap.has(questionKey)) {
            row.isUpdate = true;
            willUpdateCount++;
          } else {
            row.isUpdate = false;
            willInsertCount++;
          }
        }
      }

      if (!row.topic) {
        rowErrors.push('Topic is required');
      }

      if (row.unknownType) {
        rowErrors.push(
          `Unsupported question type '${row.rawQuestionType}' (use single_choice, multiple_choice, true_false or coding)`,
        );
      }

      if (row.rawMarks && (isNaN(row.marks) || row.marks <= 0)) {
        rowErrors.push('Marks must be a positive number');
      }
      if (row.rawNeg && (isNaN(row.negativeMarks) || row.negativeMarks < 0)) {
        rowErrors.push('Negative marks must be zero or a positive number');
      }

      if (row.isCoding) {
        if (row.testCaseJsonError) {
          rowErrors.push('test_cases column is not a valid JSON array');
        }
        const usable = (row.testCases || []).filter(
          (t: any) => t && String(t.output ?? t.expectedOutput ?? '').trim(),
        );
        if (usable.length === 0) {
          rowErrors.push(
            'Coding questions require at least one test case with expected output',
          );
        }
      }

      const isChoice = ['single_choice', 'multiple_choice'].includes(
        row.questionType,
      );
      let formattedOptions: Array<{
        text: string;
        isCorrect: boolean;
        explanation?: string;
      }> = [];

      if (isChoice) {
        // Enforce min 2 options
        const rawOptions = [
          { key: 'A', text: row.optA },
          { key: 'B', text: row.optB },
          { key: 'C', text: row.optC },
          { key: 'D', text: row.optD },
          ...(row.optE ? [{ key: 'E', text: row.optE }] : []),
        ].filter((o) => o.text && o.text.trim());

        if (rawOptions.length < 2) {
          rowErrors.push(
            'Multiple choice questions require at least 2 populated options',
          );
        }

        if (!row.correctAnswerRaw) {
          rowErrors.push('Correct answer is missing');
        } else {
          const rawAnswerParts = row.correctAnswerRaw
            .toUpperCase()
            .split(/[,/|]/)
            .map((s: string) => s.trim());

          formattedOptions = rawOptions.map((opt, idx) => {
            const matchesKey = rawAnswerParts.includes(opt.key);
            const matchesNumeric = rawAnswerParts.includes(String(idx + 1));
            const matchesText = rawAnswerParts.some(
              (ans: string) => ans.toLowerCase() === opt.text.toLowerCase(),
            );
            return {
              text: opt.text,
              isCorrect: matchesKey || matchesNumeric || matchesText,
            };
          });

          const correctCount = formattedOptions.filter(
            (o) => o.isCorrect,
          ).length;
          if (correctCount === 0) {
            rowErrors.push(
              `Correct answer '${row.correctAnswerRaw}' did not match any of options (A, B, C, D)`,
            );
          } else if (row.questionType === 'single_choice' && correctCount > 1) {
            rowErrors.push(
              'Single choice question cannot have multiple correct answers',
            );
          }
        }
      }

      if (rowErrors.length > 0) {
        invalid++;
        errors.push({
          row: row.rowNumber,
          question: row.question || `Row ${row.rowNumber}`,
          error: rowErrors.join('. '),
        });
      } else {
        validRows.push({
          rowNumber: row.rowNumber,
          questionId: row.questionId,
          title: row.title,
          slug: row.slug,
          problemStatement: row.problemStatement,
          question: row.question,
          questionType: row.questionType,
          topic: row.topic,
          subtopic: row.subtopic || undefined,
          difficulty: row.difficulty,
          marks: row.marks,
          negativeMarks: row.negativeMarks,
          options: isChoice ? formattedOptions : undefined,
          explanation: row.explanation || undefined,
          codeSnippet: row.codeSnippet || undefined,
          starterCode: row.starterCode,
          referenceSolutions: row.referenceSolutions,
          supportedLanguages: row.supportedLanguages,
          examples: row.examples,
          language: row.language !== 'general' ? row.language : undefined,
          tags: row.tags,
          constraints: row.constraints,
          inputFormat: row.inputFormat,
          outputFormat: row.outputFormat,
          hints: row.hints,
          approach: row.approach,
          expectedTimeComplexity: row.expectedTimeComplexity,
          expectedSpaceComplexity: row.expectedSpaceComplexity,
          timeLimit: row.timeLimit,
          memoryLimit: row.memoryLimit,
          executionMode: row.executionMode,
          entryPoint: row.entryPoint,
          functionName: row.functionName,
          returnType: row.returnType,
          inputType: row.inputType,
          outputType: row.outputType,
          allowCustomInput: row.allowCustomInput,
          compareMode: row.compareMode,
          partialScoring: row.partialScoring,
          isActive: row.isActive,
          createdByAuthor: row.createdByAuthor,
          version: row.version,
          testCases: row.testCases,
          isUpdate: row.isUpdate,
          status: row.isActive === false ? 'draft' : 'approved',
        });
      }
    }

    return {
      summary: {
        totalRows: parsedRows.length,
        validCount: validRows.length,
        invalidCount: invalid,
        duplicateCount: duplicatesInFile,
        toInsertCount: willInsertCount,
        toUpdateCount: willUpdateCount,
      },
      validRows,
      errors,
    };
  }

  async confirmQuestionsImport(
    validRows: any[],
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    if (!validRows || validRows.length === 0) {
      throw new BadRequestException('No valid question rows to import.');
    }

    const docs = validRows.map((r) => {
      let optionsList: string[] = [];
      let correctAnswerIndex = 0;
      if (Array.isArray(r.options)) {
        optionsList = r.options.map((o: any) =>
          typeof o === 'string' ? o : o.text || '',
        );
        const correctIdx = r.options.findIndex(
          (o: any) => typeof o === 'object' && o.isCorrect,
        );
        correctAnswerIndex = correctIdx >= 0 ? correctIdx : 0;
      }

      const isCodingRow = r.questionType === 'coding';
      const cleanSlug = r.slug
        ? r.slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9_-]/g, '-')
        : r.title
          ? r.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '') +
            '-' +
            Math.random().toString(36).substring(2, 7)
          : undefined;

      const correctIndices = Array.isArray(r.options)
        ? r.options
            .map((o: any, idx: number) =>
              typeof o === 'object' && o.isCorrect ? idx : -1,
            )
            .filter((idx: number) => idx >= 0)
        : [];
      const normalizedTestCases = (r.testCases || [])
        .map((t: any, idx: number) => ({
          id: String(t.id ?? idx + 1),
          input: String(t.input ?? ''),
          expectedOutput: String(t.expectedOutput ?? t.output ?? ''),
          isHidden: t.isHidden ?? idx >= 2,
          weight: Number(t.weight) > 0 ? Number(t.weight) : 1,
        }))
        .filter((t: any) => t.expectedOutput.trim());
      const constraintList = Array.isArray(r.constraints)
        ? r.constraints
        : String(r.constraints || '')
            .split(/[\n;]/)
            .map((c: string) => c.trim())
            .filter(Boolean);

      return {
        questionId: r.questionId,
        title:
          r.title || (r.question ? r.question.slice(0, 100) : 'Untitled Question'),
        slug: cleanSlug,
        question: r.question,
        questionType: r.questionType || (isCodingRow ? 'coding' : 'single_choice'),
        topic: r.topic,
        subtopic: r.subtopic || '',
        difficulty: r.difficulty || 'medium',
        marks: r.marks || 1,
        negativeMarks: r.negativeMarks || 0,
        options: optionsList,
        correctAnswer: correctAnswerIndex,
        correctAnswers: correctIndices,
        explanation: r.explanation || '',
        codeSnippet:
          r.codeSnippet ||
          (r.starterCode && r.starterCode[0] ? r.starterCode[0].code : ''),
        language: r.language || 'general',
        tags: r.tags || [],
        status: r.isActive === false ? 'draft' : 'approved',
        createdBy_id: adminUser?.id || adminUser?._id,
        approvedBy_id: adminUser?.id || adminUser?._id,
        approvedAt: new Date(),
        hints: r.hints || [],
        constraints: constraintList,
        inputFormat: r.inputFormat || undefined,
        outputFormat: r.outputFormat || undefined,
        ...(isCodingRow
          ? {
              problemStatement: r.problemStatement || r.question,
              description: r.problemStatement || r.question,
              constraints: constraintList,
              inputFormat: r.inputFormat || undefined,
              outputFormat: r.outputFormat || undefined,
              timeLimit: r.timeLimit || 2000,
              memoryLimit: r.memoryLimit || 256,
              testCases: normalizedTestCases,
              starterCode: r.starterCode || [],
              referenceSolutions: r.referenceSolutions || [],
              supportedLanguages:
                r.supportedLanguages && r.supportedLanguages.length > 0
                  ? r.supportedLanguages
                  : ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'],
              examples: r.examples || [],
              hints: r.hints || [],
            }
          : {}),
        metadata: {
          importedVia: 'bulk_csv',
          originalRow: r.rowNumber,
          questionId: r.questionId,
          title: r.title,
          slug: r.slug,
          approach: r.approach,
          expectedTimeComplexity: r.expectedTimeComplexity,
          expectedSpaceComplexity: r.expectedSpaceComplexity,
          executionMode: r.executionMode,
          entryPoint: r.entryPoint,
          functionName: r.functionName,
          returnType: r.returnType,
          inputType: r.inputType,
          outputType: r.outputType,
          allowCustomInput: r.allowCustomInput,
          compareMode: r.compareMode,
          partialScoring: r.partialScoring,
          isActive: r.isActive,
          createdByAuthor: r.createdByAuthor,
          version: r.version,
          starterCode: r.starterCode,
          referenceSolutions: r.referenceSolutions,
          supportedLanguages: r.supportedLanguages,
          examples: r.examples,
        },
      };
    });

    let totalUpserted = 0;
    let totalModified = 0;

    for (const doc of docs) {
      let existing: QuestionEntity | null = null;
      if (doc.questionId) {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            doc.questionId,
          );
        if (isUuid) {
          existing = await this.questionRepository.findOne({
            where: { id: doc.questionId },
          });
        }
      }
      if (!existing && doc.slug) {
        existing = await this.questionRepository.findOne({
          where: { slug: doc.slug },
        });
      }
      if (!existing) {
        existing = await this.questionRepository.findOne({
          where: doc.title
            ? [
                { question: doc.question, topic: doc.topic },
                { title: doc.title, topic: doc.topic },
              ]
            : [{ question: doc.question, topic: doc.topic }],
        });
      }

      const { questionId, ...savePayload } = doc;
      if (existing) {
        if (existing.slug && !doc.slug) {
          savePayload.slug = existing.slug;
        }
        Object.assign(existing, savePayload);
        await this.questionRepository.save(existing);
        totalModified++;
      } else {
        const newDoc = this.questionRepository.create({
          ...savePayload,
          ...(questionId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            questionId,
          )
            ? { id: questionId }
            : {}),
        } as any);
        await this.questionRepository.save(newDoc);
        totalUpserted++;
      }
    }

    await this.cacheService.invalidatePrefix('problems:');
    const totalProcessed = docs.length;

    const auditLog = this.auditLogRepository.create({
      actorId: adminUser?.id || adminUser?._id,
      actorEmail: adminUser?.email || 'admin',
      action: 'BULK_IMPORT_QUESTIONS_UPSERT',
      target: 'Question',
      targetType: 'Question',
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        totalProcessed,
        newlyInserted: totalUpserted,
        updated: totalModified,
        sampleTopics: [...new Set(docs.map((d) => d.topic))].slice(0, 5),
      },
    });
    await this.auditLogRepository.save(auditLog);

    return {
      success: true,
      message: `Successfully processed ${totalProcessed} questions (${totalUpserted} newly inserted, ${totalModified} updated).`,
      count: totalProcessed,
      insertedCount: totalUpserted,
      updatedCount: totalModified,
    };
  }

  async autoImportQuestions(
    fileBuffer: Buffer,
    adminUser: any,
    ip = '',
    userAgent = '',
  ) {
    const preview = await this.parseAndValidateQuestionsImport(fileBuffer);
    if (!preview.validRows || preview.validRows.length === 0) {
      throw new BadRequestException(
        preview.errors?.[0]?.error || 'No valid question rows found in file.',
      );
    }
    const commit = await this.confirmQuestionsImport(
      preview.validRows,
      adminUser,
      ip,
      userAgent,
    );
    return {
      success: true,
      message: commit.message,
      summary: {
        ...preview.summary,
        insertedCount: commit.insertedCount,
        updatedCount: commit.updatedCount,
      },
      validCount: preview.validRows.length,
      invalidCount: preview.summary.invalidCount,
      errors: preview.errors,
    };
  }
}
