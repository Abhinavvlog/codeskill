jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { ExamSecurityService } from './exam-security.service';

describe('ExamSecurityService', () => {
  let service: ExamSecurityService;

  beforeEach(() => {
    service = new ExamSecurityService(
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
