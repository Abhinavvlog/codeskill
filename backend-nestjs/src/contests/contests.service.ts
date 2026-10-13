import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ProblemsService } from '../problems/problems.service';
import { Contest } from '../database/entities/contest.entity';
import { ContestAttempt } from '../database/entities/contest-attempt.entity';
import { SubmissionStore } from '../database/sharding/submission-store';

@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepo: Repository<Contest>,
    @InjectRepository(ContestAttempt)
    private readonly attemptRepo: Repository<ContestAttempt>,
    private readonly problemsService: ProblemsService,
    @Optional() private readonly submissions?: SubmissionStore,
  ) {}

  async getContests() {
    const list = await this.contestRepo.find({
      where: { isPublished: true, isPrivate: false },
      order: { startTime: 'DESC' },
    });
    return list.map((contest) => this.safeContest(contest));
  }

  async getContest(slug: string) {
    const contest = await this.contestRepo.findOne({
      where: { slug, isPublished: true },
    });
    if (!contest || !contest.isPublished)
      throw new NotFoundException('Contest not found');
    return this.safeContest(contest);
  }

  async register(contestId: string, userId: string, password?: string) {
    const contest = await this.contestRepo.findOne({
      where:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          contestId,
        )
          ? [{ id: contestId }, { mongoId: contestId }]
          : { mongoId: contestId },
    });
    if (!contest || !contest.isPublished)
      throw new NotFoundException('Contest not found');
    if (Date.now() >= new Date(contest.endTime).getTime())
      throw new BadRequestException('Contest registration has closed');

    if (contest.isPrivate && contest.password !== password) {
      throw new ForbiddenException('Invalid contest password');
    }

    const participants = Array.isArray(contest.participants)
      ? contest.participants
      : [];
    if (!participants.includes(userId)) {
      contest.participants = [...participants, userId];
      await this.contestRepo.save(contest);
    }

    return { success: true };
  }
  private safeContest(contest: Contest) {
    return {
      id: contest.id,
      _id: contest.id,
      title: contest.title,
      slug: contest.slug,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      problems: contest.problems || [],
      isPrivate: contest.isPrivate,
    };
  }

  async registration(contestId: string, userId: string) {
    const validId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        contestId,
      );
    const contest = await this.contestRepo.findOne({
      where: validId
        ? [{ id: contestId }, { mongoId: contestId }]
        : { mongoId: contestId },
    });
    if (!contest || !contest.isPublished)
      throw new NotFoundException('Contest not found');
    const registered = !!contest.participants?.includes(userId);
    const attempt = registered
      ? await this.attemptRepo.findOne({
          where: { contest_id: contest.id, user_id: userId },
        })
      : null;
    return {
      registered,
      ...(attempt ? { attemptStatus: attempt.status } : {}),
    };
  }

  async leaderboard(slug: string, userId?: string) {
    const contest = await this.contestRepo.findOne({
      where: {
        slug,
        isPublished: true,
        ...(userId ? {} : { isPrivate: false }),
      },
    });
    if (
      !contest ||
      !contest.isPublished ||
      (contest.isPrivate && !contest.participants?.includes(userId || ''))
    )
      throw new NotFoundException('Contest leaderboard not found');
    const problemIds = (contest.problems || []).filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
    );
    if (this.submissions?.isSharded) {
      return this.shardedLeaderboard(contest, problemIds);
    }
    const rows: Array<{ name: string; username: string; solved: string }> =
      await this.attemptRepo.query(
        `WITH accepted AS (
          SELECT a.user_id, s."problemId", min(s."createdAt") AS solved_at
          FROM contest_attempts a JOIN submissions s ON s."userId"::text = a.user_id::text
          WHERE a.contest_id = $5 AND s."problemId" = ANY($1::uuid[]) AND lower(s.status) = 'accepted'
            AND s."createdAt" >= greatest(a."startedAt", $2::timestamp)
            AND s."createdAt" <= least(coalesce(a."submittedAt", $3::timestamp), $3::timestamp)
          GROUP BY a.user_id, s."problemId"
        )
        SELECT u.name, u.username, count(accepted."problemId") AS solved
        FROM users u LEFT JOIN accepted ON accepted.user_id::text = u.id::text
        WHERE u.id::text = ANY($4::text[])
        GROUP BY u.id, u.name, u.username
        ORDER BY count(accepted."problemId") DESC, max(accepted.solved_at) ASC NULLS LAST, u.id ASC
        LIMIT 100`,
        [
          problemIds,
          contest.startTime,
          contest.endTime,
          contest.participants || [],
          contest.id,
        ],
      );
    return {
      contest: this.safeContest(contest),
      leaderboard: rows.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        username: row.username,
        solved: Number(row.solved),
        totalProblems: problemIds.length,
      })),
    };
  }

  private async shardedLeaderboard(contest: Contest, problemIds: string[]) {
    const participants: Array<{
      id: string;
      name: string;
      username: string;
      start: string | null;
      end: string | null;
    }> = await this.attemptRepo.query(
      `SELECT u.id, u.name, u.username,
              CASE WHEN a.id IS NOT NULL THEN to_char(greatest(a."startedAt", $2::timestamp), 'YYYY-MM-DD"T"HH24:MI:SS.US') END AS start,
              CASE WHEN a.id IS NOT NULL THEN to_char(least(coalesce(a."submittedAt", $3::timestamp), $3::timestamp), 'YYYY-MM-DD"T"HH24:MI:SS.US') END AS "end"
       FROM users u LEFT JOIN contest_attempts a ON a.user_id::text = u.id::text AND a.contest_id = $1
       WHERE u.id::text = ANY($4::text[])`,
      [
        contest.id,
        contest.startTime,
        contest.endTime,
        contest.participants || [],
      ],
    );
    const windows = participants
      .filter((row) => row.start && row.end)
      .map((row) => ({ userId: row.id, start: row.start!, end: row.end! }));
    const solved = await this.submissions!.contestSolvedProblems(
      problemIds,
      windows,
    );
    const scores = new Map<
      string,
      {
        id: string;
        name: string;
        username: string;
        problems: Set<string>;
        lastSolve: number | null;
      }
    >();
    for (const participant of participants)
      scores.set(participant.id, {
        ...participant,
        problems: new Set(),
        lastSolve: null,
      });
    for (const row of solved) {
      const score = scores.get(row.userId);
      if (!score) continue;
      score.problems.add(row.problemId);
      score.lastSolve = Math.max(
        score.lastSolve ?? -Infinity,
        new Date(row.solvedAt).getTime(),
      );
    }
    const ordered = [...scores.values()]
      .sort(
        (a, b) =>
          b.problems.size - a.problems.size ||
          (a.lastSolve ?? Infinity) - (b.lastSolve ?? Infinity) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 100);
    return {
      contest: this.safeContest(contest),
      leaderboard: ordered.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        username: row.username,
        solved: row.problems.size,
        totalProblems: problemIds.length,
      })),
    };
  }

  private async eligibleContest(id: string, userId: string) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new NotFoundException('Contest not found');
    const contest = await this.contestRepo.findOne({
      where: { id, isPublished: true },
    });
    if (!contest || !contest.isPublished)
      throw new NotFoundException('Contest not found');
    if (!contest.participants?.includes(userId))
      throw new ForbiddenException('Register for this contest first');
    return contest;
  }

  async startAttempt(id: string, userId: string) {
    const contest = await this.eligibleContest(id, userId);
    const now = Date.now();
    if (
      now < new Date(contest.startTime).getTime() ||
      now >= new Date(contest.endTime).getTime()
    )
      throw new BadRequestException(
        'Contest is outside its participation window',
      );
    const problems = await Promise.all(
      (contest.problems || []).map(async (problemId) => {
        const problem =
          await this.problemsService.getExecutionProblem(problemId);
        return { id: problem.id, title: problem.title, slug: problem.slug };
      }),
    );
    await this.attemptRepo
      .createQueryBuilder()
      .insert()
      .values({
        contest_id: contest.id,
        user_id: userId,
        sessionId: randomUUID(),
      })
      .orIgnore()
      .execute();
    const attempt = await this.attemptRepo.findOne({
      where: { contest_id: contest.id, user_id: userId },
    });
    if (!attempt || attempt.status !== 'InProgress')
      throw new BadRequestException('Your contest attempt has ended');
    return {
      contest: this.safeContest(contest),
      problems,
      sessionId: attempt.sessionId,
      startedAt: attempt.startedAt,
      antiCheatConfig: contest.antiCheatConfig as Record<string, unknown>,
    };
  }

  async submitAttempt(id: string, userId: string, sessionId: string) {
    const contest = await this.eligibleContest(id, userId);
    const attempt = await this.attemptRepo.findOne({
      where: { contest_id: contest.id, user_id: userId },
    });
    if (!attempt || attempt.sessionId !== sessionId)
      throw new ForbiddenException('Invalid contest session');
    await this.attemptRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'Submitted', submittedAt: new Date() })
      .where('id = :id AND status = :status', {
        id: attempt.id,
        status: 'InProgress',
      })
      .execute();
    return { success: true, slug: contest.slug };
  }

  async recordViolation(
    id: string,
    userId: string,
    sessionId: string,
    type: string,
  ) {
    const contest = await this.eligibleContest(id, userId);
    if (typeof type !== 'string' || !type || type.length > 100)
      throw new BadRequestException('Invalid violation');
    const config = contest.antiCheatConfig as Record<string, unknown>;
    const limit = Math.max(1, Number(config?.warningLimit) || 5);
    const rows: Array<{ warnings: number; status: string }> =
      await this.attemptRepo.query(
        `UPDATE contest_attempts SET warnings = warnings + 1,
        violations = violations || jsonb_build_array(jsonb_build_object('type', $4::text, 'timestamp', now())),
        status = CASE WHEN $5::boolean AND warnings + 1 >= $6 THEN 'Terminated' ELSE status END,
        "submittedAt" = CASE WHEN $5::boolean AND warnings + 1 >= $6 THEN now() ELSE "submittedAt" END
       WHERE contest_id = $1 AND user_id = $2 AND "sessionId" = $3 AND status = 'InProgress'
       RETURNING warnings, status`,
        [
          contest.id,
          userId,
          sessionId,
          type,
          config?.autoSubmitOnViolation !== false,
          limit,
        ],
      );
    if (!rows[0])
      throw new ForbiddenException('Invalid or ended contest session');
    return {
      success: true,
      warnings: rows[0].warnings,
      forceSubmit: rows[0].status === 'Terminated',
    };
  }
}
