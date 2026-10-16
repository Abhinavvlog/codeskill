jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => {},
  InjectDataSource: () => () => {},
}));
import { SubmissionsService } from './submissions.service';

describe('Problem statistics response', () => {
  const store = { problemStats: jest.fn() };
  let service: SubmissionsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubmissionsService(
      store as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('returns live aggregates with a rounded acceptance rate', async () => {
    store.problemStats.mockResolvedValue({
      totalSubmissions: 3,
      acceptedSubmissions: 1,
      solvers: 2,
      acceptedSolvers: 1,
    });
    expect(await service.getProblemStats('problem-1')).toEqual({
      problemId: 'problem-1',
      totalSubmissions: 3,
      acceptedSubmissions: 1,
      acceptanceRate: 33.3,
      solvers: 2,
      acceptedSolvers: 1,
    });
    expect(store.problemStats).toHaveBeenCalledWith('problem-1');
  });

  it('reports all-zero statistics for problems without submissions', async () => {
    store.problemStats.mockResolvedValue({
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      solvers: 0,
      acceptedSolvers: 0,
    });
    expect(await service.getProblemStats('fresh-problem')).toMatchObject({
      totalSubmissions: 0,
      acceptanceRate: 0,
      solvers: 0,
    });
  });

  it('propagates a shard outage instead of masking it as zero submissions', async () => {
    store.problemStats.mockRejectedValue(new Error('Shard unavailable'));
    await expect(service.getProblemStats('problem-1')).rejects.toThrow(
      'Shard unavailable',
    );
  });
});
