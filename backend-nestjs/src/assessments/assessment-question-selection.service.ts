import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from '../database/entities/question.entity';
import { Assessment } from '../database/entities/assessment.entity';

export interface QuestionSelectionConfig {
  mode: 'automatic' | 'manual';
  manualStrategy?: 'fixed' | 'random_pool';
  counts: {
    easy: number;
    medium: number;
    hard: number;
  };
  filters?: {
    topics?: string[];
    questionTypes?: string[];
  };
  selectedQuestionIds?: string[];
  frozenPoolQuestionIds?: string[];
  marksPerDifficulty?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
}

@Injectable()
export class AssessmentQuestionSelectionService {
  private readonly logger = new Logger(AssessmentQuestionSelectionService.name);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  /**
   * Helper to sample N elements randomly without replacement (no duplicates).
   */
  sampleWithoutReplacement<T>(items: T[], count: number): T[] {
    if (items.length <= count) return [...items];
    const copy = [...items];
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  /**
   * Validates the assessment configuration, verifies sufficient approved questions exist
   * for each requested difficulty tier, and freezes the eligible pool.
   */
  async validateAndFreezePool(
    selectionConfig?: Partial<QuestionSelectionConfig>,
    fallbackQuestionIds: string[] = [],
  ): Promise<QuestionSelectionConfig> {
    // 1. Legacy or Default Fallback
    if (!selectionConfig || !selectionConfig.mode) {
      const validIds = Array.isArray(fallbackQuestionIds)
        ? fallbackQuestionIds.map((id) => String(id))
        : [];
      const questions =
        validIds.length > 0
          ? await this.questionRepo.find({
              where: [{ id: In(validIds) }, { mongoId: In(validIds) }],
            })
          : [];

      const counts = { easy: 0, medium: 0, hard: 0 };
      questions.forEach((q) => {
        const diff = (q.difficulty || 'medium').toLowerCase();
        if (diff === 'easy') counts.easy++;
        else if (diff === 'hard') counts.hard++;
        else counts.medium++;
      });

      return {
        mode: 'manual',
        manualStrategy: 'fixed',
        counts,
        selectedQuestionIds: validIds,
        frozenPoolQuestionIds: validIds,
      };
    }

    const { mode, counts, filters, selectedQuestionIds, manualStrategy, marksPerDifficulty } =
      selectionConfig;

    const easyCount = Math.max(0, Number(counts?.easy) || 0);
    const mediumCount = Math.max(0, Number(counts?.medium) || 0);
    const hardCount = Math.max(0, Number(counts?.hard) || 0);
    const totalRequired = easyCount + mediumCount + hardCount;

    // 2. Mode: Automatic
    if (mode === 'automatic') {
      if (totalRequired <= 0) {
        throw new BadRequestException(
          'Automatic question selection requires at least one question (sum of easy, medium, and hard counts must be > 0).',
        );
      }

      const qb = this.questionRepo
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'approved' });

      if (filters?.topics && filters.topics.length > 0) {
        qb.andWhere('q.topic IN (:...topics)', { topics: filters.topics });
      }
      if (filters?.questionTypes && filters.questionTypes.length > 0) {
        qb.andWhere('LOWER(q.questionType) IN (:...types)', {
          types: filters.questionTypes.map((t) => t.toLowerCase()),
        });
      }

      const eligibleQuestions = await qb.getMany();

      const easyPool = eligibleQuestions.filter(
        (q) => (q.difficulty || '').toLowerCase() === 'easy',
      );
      const mediumPool = eligibleQuestions.filter(
        (q) => (q.difficulty || 'medium').toLowerCase() === 'medium',
      );
      const hardPool = eligibleQuestions.filter(
        (q) => (q.difficulty || '').toLowerCase() === 'hard',
      );

      if (easyPool.length < easyCount) {
        throw new BadRequestException(
          `Automatic pool has insufficient questions for difficulty "Easy". Required: ${easyCount}, but only ${easyPool.length} approved questions match the criteria.`,
        );
      }
      if (mediumPool.length < mediumCount) {
        throw new BadRequestException(
          `Automatic pool has insufficient questions for difficulty "Medium". Required: ${mediumCount}, but only ${mediumPool.length} approved questions match the criteria.`,
        );
      }
      if (hardPool.length < hardCount) {
        throw new BadRequestException(
          `Automatic pool has insufficient questions for difficulty "Hard". Required: ${hardCount}, but only ${hardPool.length} approved questions match the criteria.`,
        );
      }

      const frozenPoolQuestionIds = eligibleQuestions.map((q) => q.id);

      return {
        mode: 'automatic',
        counts: { easy: easyCount, medium: mediumCount, hard: hardCount },
        filters: {
          topics: filters?.topics || [],
          questionTypes: filters?.questionTypes || [],
        },
        frozenPoolQuestionIds,
        marksPerDifficulty,
      };
    }

    // 3. Mode: Manual
    if (mode === 'manual') {
      const qIds = Array.isArray(selectedQuestionIds)
        ? selectedQuestionIds.map((id) => String(id))
        : [];
      if (qIds.length === 0) {
        throw new BadRequestException(
          'Manual question selection requires at least one question in selectedQuestionIds.',
        );
      }

      const questions = await this.questionRepo.find({
        where: [{ id: In(qIds) }, { mongoId: In(qIds) }],
      });

      if (questions.length !== qIds.length) {
        throw new BadRequestException(
          `One or more selected questions could not be found or are inaccessible in the question bank. Found ${questions.length} of ${qIds.length}.`,
        );
      }

      const strategy = manualStrategy || 'fixed';

      if (strategy === 'fixed') {
        const derivedCounts = { easy: 0, medium: 0, hard: 0 };
        questions.forEach((q) => {
          const diff = (q.difficulty || 'medium').toLowerCase();
          if (diff === 'easy') derivedCounts.easy++;
          else if (diff === 'hard') derivedCounts.hard++;
          else derivedCounts.medium++;
        });

        return {
          mode: 'manual',
          manualStrategy: 'fixed',
          counts: derivedCounts,
          selectedQuestionIds: qIds,
          frozenPoolQuestionIds: qIds,
          marksPerDifficulty,
        };
      }

      if (strategy === 'random_pool') {
        if (totalRequired <= 0) {
          throw new BadRequestException(
            'Manual random_pool strategy requires at least one question (sum of easy, medium, and hard counts must be > 0).',
          );
        }

        const easyPool = questions.filter(
          (q) => (q.difficulty || '').toLowerCase() === 'easy',
        );
        const mediumPool = questions.filter(
          (q) => (q.difficulty || 'medium').toLowerCase() === 'medium',
        );
        const hardPool = questions.filter(
          (q) => (q.difficulty || '').toLowerCase() === 'hard',
        );

        if (easyPool.length < easyCount) {
          throw new BadRequestException(
            `Manual selected pool contains insufficient "Easy" questions. Required: ${easyCount}, but selected pool only has ${easyPool.length}.`,
          );
        }
        if (mediumPool.length < mediumCount) {
          throw new BadRequestException(
            `Manual selected pool contains insufficient "Medium" questions. Required: ${mediumCount}, but selected pool only has ${mediumPool.length}.`,
          );
        }
        if (hardPool.length < hardCount) {
          throw new BadRequestException(
            `Manual selected pool contains insufficient "Hard" questions. Required: ${hardCount}, but selected pool only has ${hardPool.length}.`,
          );
        }

        return {
          mode: 'manual',
          manualStrategy: 'random_pool',
          counts: { easy: easyCount, medium: mediumCount, hard: hardCount },
          selectedQuestionIds: qIds,
          frozenPoolQuestionIds: qIds,
          marksPerDifficulty,
        };
      }
    }

    throw new BadRequestException(`Unsupported question selection mode: ${mode}`);
  }

  /**
   * Assigns a difficulty-balanced question set for a student's attempt.
   * Guarantees zero duplicate questions within the attempt.
   */
  async assignQuestionsForAttempt(
    assessment: Assessment,
    studentId: string,
    attemptNumber: number,
  ): Promise<{ assignedQuestions: Question[]; orderedQuestionIds: string[]; maxScore: number }> {
    const config = (assessment as any).questionSelection;

    // Legacy or manual fixed list: Every student receives all questions
    if (!config || (config.mode === 'manual' && config.manualStrategy === 'fixed')) {
      const qIds = config?.frozenPoolQuestionIds?.length
        ? config.frozenPoolQuestionIds
        : assessment.questions || [];

      const questions =
        qIds.length > 0
          ? await this.questionRepo.find({
              where: [{ id: In(qIds) }, { mongoId: In(qIds) }],
            })
          : [];

      // Maintain original or shuffled order
      let ordered = [...questions];
      if (assessment.shuffleQuestions) {
        ordered = [...ordered].sort(() => Math.random() - 0.5);
      }

      const maxScore = ordered.reduce((sum, q) => sum + (q.marks || 1), 0);
      return {
        assignedQuestions: ordered,
        orderedQuestionIds: ordered.map((q) => q.id),
        maxScore,
      };
    }

    // Dynamic selection: Automatic OR Manual Random Pool
    const poolIds = config.frozenPoolQuestionIds || [];
    if (poolIds.length === 0) {
      throw new BadRequestException('Assessment has an empty question pool.');
    }

    const poolQuestions = await this.questionRepo.find({
      where: [{ id: In(poolIds) }, { mongoId: In(poolIds) }],
    });

    const easyPool = poolQuestions.filter(
      (q) => (q.difficulty || '').toLowerCase() === 'easy',
    );
    const mediumPool = poolQuestions.filter(
      (q) => (q.difficulty || 'medium').toLowerCase() === 'medium',
    );
    const hardPool = poolQuestions.filter(
      (q) => (q.difficulty || '').toLowerCase() === 'hard',
    );

    const easySample = this.sampleWithoutReplacement(easyPool, config.counts.easy);
    const medSample = this.sampleWithoutReplacement(mediumPool, config.counts.medium);
    const hardSample = this.sampleWithoutReplacement(hardPool, config.counts.hard);

    // Combine all sampled questions (uniqueness within attempt guaranteed by sampling per disjoint pool)
    const combined = [...easySample, ...medSample, ...hardSample];

    // Verify exact counts were met
    if (combined.length !== (config.counts.easy + config.counts.medium + config.counts.hard)) {
      this.logger.error(
        `Failed to fulfill question quota for student ${studentId}. Needed ${
          config.counts.easy + config.counts.medium + config.counts.hard
        }, got ${combined.length}`,
      );
      throw new BadRequestException('Unable to generate full question assignment from pool.');
    }

    let ordered = combined;
    if (assessment.shuffleQuestions) {
      ordered = [...ordered].sort(() => Math.random() - 0.5);
    }

    // Calculate maximum score
    let maxScore = 0;
    if (config.marksPerDifficulty) {
      const easyMark = config.marksPerDifficulty.easy ?? 1;
      const medMark = config.marksPerDifficulty.medium ?? 2;
      const hardMark = config.marksPerDifficulty.hard ?? 5;
      maxScore =
        config.counts.easy * easyMark +
        config.counts.medium * medMark +
        config.counts.hard * hardMark;
    } else {
      maxScore = ordered.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    return {
      assignedQuestions: ordered,
      orderedQuestionIds: ordered.map((q) => q.id),
      maxScore,
    };
  }
}
