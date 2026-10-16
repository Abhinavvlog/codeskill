jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
import { CredentialEmailProcessor } from './credential-email.processor';

describe('Credential email secret retention', () => {
  const repo = { findOne: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
  const email = { sendCredentialEmail: jest.fn() };
  const processor = new CredentialEmailProcessor(repo as never, email as never);
  beforeEach(() => jest.clearAllMocks());
  it.each([[0, 'retrying', 'temporary'], [2, 'failed', '']])(
    'purges the secret only when retries are exhausted (%s)', async (attemptsMade, status, password) => {
      const row = { id: 'email-job', uid: 'student', temporaryPassword: 'temporary', retryCount: attemptsMade };
      repo.findOne.mockResolvedValue(row);
      email.sendCredentialEmail.mockRejectedValue(new Error('mail delivery failed'));
      await expect(processor.process({ data: { emailJobId: row.id }, attemptsMade, opts: { attempts: 3 } } as never))
        .rejects.toThrow('mail delivery failed');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status, temporaryPassword: password }));
    },
  );
});
