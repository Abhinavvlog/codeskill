jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => {},
  InjectDataSource: () => () => {},
}));
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsController Route Order (AUD-014)', () => {
  let controller: SubmissionsController;

  const mockSubmissionsService = {
    getRecentSubmissions: jest.fn().mockResolvedValue([]),
    getUserStats: jest.fn().mockResolvedValue({ totalSubmissions: 5 }),
    getSubmissionsByUser: jest.fn().mockResolvedValue({ total: 2, items: [] }),
    getSubmissionsByProblem: jest.fn().mockResolvedValue([]),
    getSubmissionById: jest.fn().mockResolvedValue({ id: 'sub-123' }),
    getSubmissionResult: jest.fn().mockResolvedValue({ status: 'completed' }),
    cancelSubmission: jest.fn().mockResolvedValue({ cancelled: true }),
    createSubmission: jest.fn().mockResolvedValue({ _id: 'new-id', status: 'queued' }),
  };

  beforeEach(() => {
    controller = new SubmissionsController(mockSubmissionsService as never);
    jest.clearAllMocks();
  });

  it('routes recent submissions to getRecentSubmissions without treating "recent" as submission ID', async () => {
    const res = await controller.getRecentSubmissions('user-1');
    expect(mockSubmissionsService.getRecentSubmissions).toHaveBeenCalledWith('user-1');
    expect(mockSubmissionsService.getSubmissionById).not.toHaveBeenCalled();
    expect(res).toEqual({ count: 0, data: [] });
  });

  it('routes stats to getUserStats without treating "stats" as submission ID', async () => {
    const res = await controller.getUserStats('user-1');
    expect(mockSubmissionsService.getUserStats).toHaveBeenCalledWith('user-1');
    expect(mockSubmissionsService.getSubmissionById).not.toHaveBeenCalled();
    expect(res).toEqual({ totalSubmissions: 5 });
  });

  it('routes explicit submission ID to getSubmissionById', async () => {
    const res = await controller.getSubmission('user-1', 'student', 'real-sub-uuid');
    expect(mockSubmissionsService.getSubmissionById).toHaveBeenCalledWith(
      'user-1',
      'real-sub-uuid',
      false,
    );
    expect(res).toEqual({ success: true, submission: { id: 'sub-123' } });
  });
});
