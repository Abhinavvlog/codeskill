jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';

const id = '00000000-0000-4000-8000-000000000001';
const payload = {
  title: 'Updated Contest',
  slug: 'updated-contest',
  description: 'Updated details',
  startTime: '2026-11-01T04:30:00Z',
  endTime: '2026-11-01T06:30:00Z',
  problems: ['p1', 'p2'],
  isPrivate: true,
  password: 'access-code',
  isPublished: true,
};

describe('Admin contest editing', () => {
  let service: AdminService;
  type ContestRecord = {
    id: string;
    title: string;
    slug: string;
    [key: string]: unknown;
  };
  type Lookup = {
    where: { id?: string; mongoId?: string }[] | { slug: string };
  };
  let stored: ContestRecord;
  const makeRepository = () => ({
    findOne: jest.fn(({ where }: Lookup) =>
      Promise.resolve(Array.isArray(where) ? { ...stored } : null),
    ),
    save: jest.fn((contest: ContestRecord) => {
      stored = { ...contest };
      return Promise.resolve(contest);
    }),
    create: jest.fn(
      (data: { title: string; slug: string; [key: string]: unknown }) => ({
        id,
        ...data,
      }),
    ),
    remove: jest.fn().mockResolvedValue(undefined),
  });
  let repo: ReturnType<typeof makeRepository>;

  beforeEach(() => {
    stored = {
      id,
      title: 'Original',
      slug: 'original',
      participants: ['candidate'],
      antiCheatConfig: { warningLimit: 3 },
    };
    repo = makeRepository();
    service = new AdminService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      repo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('persists the selected contest and reloads fields while retaining participants and security configuration', async () => {
    await service.updateContest(id, {
      ...payload,
      id: 'another-id',
      participants: [],
    });
    const reloaded = await service.getContestById(id);
    expect(reloaded).toEqual(
      expect.objectContaining({
        id,
        title: payload.title,
        slug: payload.slug,
        problems: ['p1', 'p2'],
        isPrivate: true,
        password: 'access-code',
        isPublished: true,
        participants: ['candidate'],
        antiCheatConfig: { warningLimit: 3 },
      }),
    );
    expect(reloaded.startTime).toEqual(new Date(payload.startTime));
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: [{ id }, { mongoId: id }],
    });
  });

  it('rejects a conflicting slug without saving', async () => {
    repo.findOne.mockResolvedValueOnce({ ...stored }).mockResolvedValueOnce({
      id: 'other-id',
      title: 'Other',
      slug: payload.slug,
    });
    await expect(service.updateContest(id, payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects invalid dates and missing problems without saving', async () => {
    await expect(
      service.updateContest(id, { ...payload, endTime: payload.startTime }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateContest(id, { ...payload, problems: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('handles missing and malformed IDs without updating another contest', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.updateContest(id, payload)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.getContestById('undefined')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('looks up legacy Mongo IDs without querying the PostgreSQL UUID column', async () => {
    const legacyId = '507f1f77bcf86cd799439011';
    await service.getContestById(legacyId);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: [{ mongoId: legacyId }],
    });
  });

  it('keeps create and delete persistence intact', async () => {
    await service.createContest(payload);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: payload.slug }),
    );
    expect(repo.save).toHaveBeenCalled();
    await service.deleteContest(id);
    expect(repo.remove).toHaveBeenCalledWith(expect.objectContaining({ id }));
  });
});
