jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => {},
  InjectDataSource: () => () => {},
}));
import { Logger, ForbiddenException } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';

describe('Submission feedback response', () => {
  const store = { performanceComparison: jest.fn(), runtimeDistribution: jest.fn() };
  let service: SubmissionsService;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    service = new SubmissionsService(
      store as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    jest
      .spyOn(service, 'getSubmissionById')
      .mockResolvedValue({
        id: 'submission',
        status: 'accepted',
        language: 'py',
        runtime: 12,
        memory: 6,
        testCasesPassed: 5,
        totalTestCases: 5,
        testResults: [],
      } as any);
  });
  afterEach(() => jest.restoreAllMocks());
  it('returns persisted measurements and anonymous comparisons for accepted submissions', async () => {
    store.performanceComparison.mockResolvedValue({
      runtime: { percentile: 75, sampleSize: 4 },
      memory: null,
    });
    store.runtimeDistribution.mockResolvedValue({
      buckets: [{ min: 0, max: 10, count: 2 }, { min: 10, max: 20, count: 1 }],
      sampleSize: 3,
    });
    const result = await service.getSubmissionResult('student', 'submission');
    expect(result).toMatchObject({
      runtime: 12,
      memory: 6,
      testCasesPassed: 5,
      totalTestCases: 5,
      comparison: { runtime: { percentile: 75, sampleSize: 4 } },
      distribution: {
        buckets: [{ min: 0, max: 10, count: 2 }, { min: 10, max: 20, count: 1 }],
        sampleSize: 3,
      },
    });
    expect(store.performanceComparison).toHaveBeenCalledWith(
      expect.anything(),
      ['python', 'python3', 'py'],
    );
    expect(store.runtimeDistribution).toHaveBeenCalledWith(
      expect.anything(),
      ['python', 'python3', 'py'],
    );
  });
  it('keeps the verdict available when comparison storage fails', async () => {
    store.performanceComparison.mockRejectedValue(
      new Error('Shard unavailable'),
    );
    expect(
      await service.getSubmissionResult('student', 'submission'),
    ).toMatchObject({ status: 'accepted', comparison: null });
  });
  it('does not compare an incomplete or unsuccessful submission to accepted results', async () => {
    jest
      .mocked(service.getSubmissionById)
      .mockResolvedValue({
        id: 'submission',
        status: 'wrong_answer',
        testResults: [],
      } as any);
    expect(
      (await service.getSubmissionResult('student', 'submission')).comparison,
    ).toBeNull();
    expect(store.performanceComparison).not.toHaveBeenCalled();
  });
  it('checks ownership before querying peer statistics', async () => {
    jest
      .mocked(service.getSubmissionById)
      .mockRejectedValue(new ForbiddenException());
    await expect(
      service.getSubmissionResult('other-student', 'submission'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(store.performanceComparison).not.toHaveBeenCalled();
  });
});
