jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { ExamSecurityController } from './exam-security.controller';

describe('ExamSecurityController', () => {
  let controller: ExamSecurityController;

  beforeEach(() => {
    controller = new ExamSecurityController({} as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
