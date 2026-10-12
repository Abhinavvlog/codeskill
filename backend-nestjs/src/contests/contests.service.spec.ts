jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ContestsService } from './contests.service';
const id = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';
const contest = {
  id,
  title: 'Real Contest',
  slug: 'real-contest',
  description: 'Description',
  isPublished: true,
  isPrivate: false,
  password: 'SECRET-PASSWORD',
  participants: [userId],
  problems: [id],
  startTime: new Date(Date.now() - 60000),
  endTime: new Date(Date.now() + 3600000),
  antiCheatConfig: { warningLimit: 3 },
};
function setup() {
  const builder = {
    insert: jest.fn(),
    values: jest.fn(),
    orIgnore: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    where: jest.fn(),
    execute: jest.fn().mockResolvedValue({}),
  };
  for (const key of [
    'insert',
    'values',
    'orIgnore',
    'update',
    'set',
    'where',
  ] as const)
    builder[key].mockReturnValue(builder);
  const contests = {
    find: jest.fn().mockResolvedValue([contest]),
    findOne: jest.fn().mockResolvedValue(contest),
    save: jest.fn().mockResolvedValue(contest),
  };
  const attempts = {
    query: jest
      .fn<Promise<unknown[]>, [string, unknown[]]>()
      .mockResolvedValue([]),
    createQueryBuilder: jest.fn(() => builder),
    findOne: jest.fn().mockResolvedValue({
      id,
      sessionId: 'real-session',
      status: 'InProgress',
      startedAt: contest.startTime,
    }),
  };
  const problems = {
    getExecutionProblem: jest
      .fn()
      .mockResolvedValue({ id, title: 'Real problem', slug: 'real-problem' }),
  };
  return {
    service: new ContestsService(
      contests as never,
      attempts as never,
      problems as never,
    ),
    contests,
    attempts,
    problems,
    builder,
  };
}
it('lists published public database contests and exposes no passwords or participant IDs', async () => {
  const { service, contests } = setup();
  const result = await service.getContests();
  expect(contests.find).toHaveBeenCalledWith({
    where: { isPublished: true, isPrivate: false },
    order: { startTime: 'DESC' },
  });
  expect(result[0]).toMatchObject({
    id,
    slug: 'real-contest',
    title: 'Real Contest',
  });
  expect(result[0]).not.toHaveProperty('password');
  expect(result[0]).not.toHaveProperty('participants');
});
it('preserves private link details without exposing the password', async () => {
  const { service, contests } = setup();
  contests.findOne.mockResolvedValue({ ...contest, isPrivate: true });
  const result = await service.getContest('real-contest');
  expect(result.isPrivate).toBe(true);
  expect(result).not.toHaveProperty('password');
});
it.each([false, 'missing'])(
  'rejects registration for an unpublished/missing contest: %p',
  async (mode) => {
    const { service, contests } = setup();
    contests.findOne.mockResolvedValue(
      mode === false ? { ...contest, isPublished: false } : null,
    );
    await expect(service.register(id, userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(contests.save).not.toHaveBeenCalled();
  },
);
it('blocks closed registration and incorrect private passwords', async () => {
  const { service, contests } = setup();
  contests.findOne.mockResolvedValueOnce({
    ...contest,
    endTime: new Date(Date.now() - 1000),
  });
  await expect(service.register(id, userId)).rejects.toBeInstanceOf(
    BadRequestException,
  );
  contests.findOne.mockResolvedValueOnce({ ...contest, isPrivate: true });
  await expect(service.register(id, userId, 'wrong')).rejects.toBeInstanceOf(
    ForbiddenException,
  );
});
it('persists registration and ignores repeated registration', async () => {
  const { service, contests } = setup();
  contests.findOne.mockResolvedValueOnce({ ...contest, participants: [] });
  await service.register(id, userId);
  expect(contests.save).toHaveBeenCalledWith(
    expect.objectContaining({ participants: [userId] }),
  );
  contests.save.mockClear();
  await service.register(id, userId);
  expect(contests.save).not.toHaveBeenCalled();
});
it('returns only the authenticated student registration state', async () => {
  const { service } = setup();
  expect(await service.registration(id, userId)).toEqual({ registered: true });
  expect(await service.registration(id, 'other')).toEqual({
    registered: false,
  });
});
it('creates or resumes a guarded real attempt with canonical published problem IDs', async () => {
  const { service, builder, problems } = setup();
  const result = await service.startAttempt(id, userId);
  expect(result).toMatchObject({
    sessionId: 'real-session',
    problems: [{ id, title: 'Real problem', slug: 'real-problem' }],
  });
  expect(problems.getExecutionProblem).toHaveBeenCalledWith(id);
  expect(builder.orIgnore).toHaveBeenCalled();
  expect(result.contest).not.toHaveProperty('participants');
});
it.each(['upcoming', 'ended', 'unregistered', 'unpublished'])(
  'blocks unavailable attempts: %s',
  async (state) => {
    const { service, contests, builder } = setup();
    contests.findOne.mockResolvedValue({
      ...contest,
      ...(state === 'upcoming'
        ? { startTime: new Date(Date.now() + 60000) }
        : state === 'ended'
          ? { endTime: new Date(Date.now() - 1000) }
          : state === 'unregistered'
            ? { participants: [] }
            : { isPublished: false }),
    });
    await expect(service.startAttempt(id, userId)).rejects.toThrow();
    expect(builder.execute).not.toHaveBeenCalled();
  },
);
it('does not resume a completed session or trust client session identity', async () => {
  const { service, attempts, builder } = setup();
  attempts.findOne.mockResolvedValueOnce({ status: 'Submitted' });
  await expect(service.startAttempt(id, userId)).rejects.toBeInstanceOf(
    BadRequestException,
  );
  await expect(
    service.submitAttempt(id, userId, 'wrong'),
  ).rejects.toBeInstanceOf(ForbiddenException);
  builder.execute.mockClear();
  await service.submitAttempt(id, userId, 'real-session');
  expect(builder.where).toHaveBeenLastCalledWith(
    'id = :id AND status = :status',
    { id, status: 'InProgress' },
  );
});
it('records violations only for the authenticated active session and applies configured thresholds', async () => {
  const { service, attempts } = setup();
  attempts.query.mockResolvedValueOnce([{ warnings: 3, status: 'Terminated' }]);
  expect(
    await service.recordViolation(id, userId, 'real-session', 'tab_switch'),
  ).toEqual({ success: true, warnings: 3, forceSubmit: true });
  expect(attempts.query.mock.calls[0][1]).toEqual([
    id,
    userId,
    'real-session',
    'tab_switch',
    true,
    3,
  ]);
  await expect(
    service.recordViolation(id, userId, 'wrong', 'tab_switch'),
  ).rejects.toBeInstanceOf(ForbiddenException);
});
it('ranks actual accepted submissions, using parameters and excluding unpublished/private contests', async () => {
  const { service, contests, attempts } = setup();
  attempts.query.mockResolvedValueOnce([
    { name: 'Candidate', username: 'candidate', solved: '1' },
  ]);
  const result = await service.leaderboard('real-contest');
  expect(contests.findOne).toHaveBeenCalledWith({
    where: { slug: 'real-contest', isPublished: true, isPrivate: false },
  });
  expect(result.leaderboard).toEqual([
    {
      rank: 1,
      name: 'Candidate',
      username: 'candidate',
      solved: 1,
      totalProblems: 1,
    },
  ]);
  expect(attempts.query.mock.calls[0][1]).toEqual([
    [id],
    contest.startTime,
    contest.endTime,
    [userId],
  ]);
  contests.findOne.mockResolvedValueOnce(null);
  await expect(service.leaderboard('private')).rejects.toBeInstanceOf(
    NotFoundException,
  );
});
