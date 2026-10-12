import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Problem as ProblemEntity } from '../database/entities/problem.entity';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(ProblemEntity)
    private problemRepository: Repository<ProblemEntity>,
    private cacheService: CacheService,
  ) {}

  async getProblems(query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const difficulty = query.difficulty || 'all';
    const category = query.category || 'all';
    const search = query.search || 'none';

    const cacheKey = `problems:${page}:${limit}:${difficulty}:${category}:${search}`;
    const cachedData = await this.cacheService.get<any>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const qb = this.problemRepository.createQueryBuilder('problem');

    // Visibility filter
    qb.where(new Brackets((qbInner) => {
      qbInner.where('problem.visibility IN (:...vis)', { vis: ['Published', 'published', 'Public', 'public'] })
             .orWhere('problem.visibility IS NULL');
    }));

    if (difficulty !== 'all') {
      qb.andWhere('problem.difficulty = :difficulty', { difficulty });
    }

    if (category !== 'All Topics' && category !== 'all') {
      // PostgreSQL text[] array inclusion check
      qb.andWhere(`EXISTS (SELECT 1 FROM unnest(problem.tags) AS t WHERE t ILIKE :category)`, { category: `%${category}%` });
    }

    if (search !== 'none' && search.trim()) {
      const s = search.trim();
      qb.andWhere(new Brackets((searchQb) => {
        searchQb.where('problem.title ILIKE :search', { search: `%${s}%` })
                .orWhere('problem.slug ILIKE :search', { search: `%${s}%` })
                .orWhere(`EXISTS (SELECT 1 FROM unnest(problem.tags) AS t WHERE t ILIKE :search)`, { search: `%${s}%` });
      }));
    }

    const [problems, total] = await qb
      .select([
        'problem.id',
        'problem.title',
        'problem.slug',
        'problem.difficulty',
        'problem.tags',
        'problem.stats',
        'problem.createdAt',
        'problem.updatedAt'
      ])
      .orderBy('problem.createdAt', 'DESC')
      .addOrderBy('problem.id', 'DESC')
      .skip(startIndex)
      .take(limit)
      .getManyAndCount();

    const mappedProblems = problems.map(p => ({
      ...p,
      categories: p.tags // Mapping tags to categories for frontend compatibility
    }));

    const result = {
      count: problems.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      totalPages: Math.ceil(total / limit) || 1,
      data: mappedProblems,
    };

    await this.cacheService.set(cacheKey, result, 300); // cache for 5 min
    return result;
  }

  async getProblemBySlug(slug: string) {
    const cacheKey = `problem:${slug}`;
    const cachedData = await this.cacheService.get<any>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    let problem = await this.problemRepository.createQueryBuilder('problem')
      .where('problem.slug = :slug', { slug })
      .andWhere(new Brackets((qbInner) => {
        qbInner.where('problem.visibility IN (:...vis)', { vis: ['Published', 'published', 'Public', 'public'] })
               .orWhere('problem.visibility IS NULL');
      }))
      .getOne();

    if (!problem) {
      // Fallback
      problem = await this.problemRepository.findOne({ where: { slug } });
    }

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    // Don't leak reference solutions or hidden test cases in public API
    if (problem.starterCode && problem.starterCode['referenceSolution']) {
      delete problem.starterCode['referenceSolution'];
    }

    if (problem.testCases && Array.isArray(problem.testCases)) {
      problem.testCases = problem.testCases.filter(c => !c.isHidden);
    }

    // Mapping to legacy payload structure for frontend compatibility
    const mappedProblem = {
      ...problem,
      statement: {
        description: problem.description,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        examples: problem.examples,
        hints: problem.hints,
      },
      config: {
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        supportedLanguages: problem.supportedLanguages,
        difficulty: problem.difficulty,
      },
      testCases: {
        cases: problem.testCases,
      }
    };

    await this.cacheService.set(cacheKey, { data: mappedProblem }, 3600); // Cache for 1 hour
    return { data: mappedProblem };
  }
}
