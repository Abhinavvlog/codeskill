import { PetService } from './pet.service';
import { ProblemsService } from '../problems/problems.service';

jest.mock('../problems/problems.service', () => ({
  ProblemsService: class {},
}));

describe('PetService OpenRouter integration', () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousModel = process.env.OPENROUTER_MODEL;
  const previousDeepSeekKey = process.env.DEEPSEEK_API_KEY;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'paid-model';
    delete process.env.DEEPSEEK_API_KEY;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = previousModel;
    if (previousDeepSeekKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousDeepSeekKey;
  });

  it('sends the question through the free router and returns its answer', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  'Which operation links the two input values to the requested output?',
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const problemsService = {
      getProblemBySlug: jest.fn().mockResolvedValue({
        data: {
          title: 'Synthetic addition',
          description: 'Add two numbers.',
          hints: ['Add the two inputs and print the result.'],
          editorial: 'Private full solution.',
        },
      }),
    } as unknown as ProblemsService;
    const service = new PetService(problemsService);

    const result = await service.ask('test-user', {
      question: 'How should I begin?',
      problemSlug: 'synthetic-addition',
      code: 'const total = 0;',
      language: 'javascript',
      history: [
        { role: 'assistant', content: 'Old complete code should stay out.' },
        { role: 'user', content: 'What are the inputs?' },
      ],
    });

    expect(result).toEqual({
      reply:
        'Which operation links the two input values to the requested output?',
      source: 'openrouter',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options?.headers).toMatchObject({
      Authorization: 'Bearer test-key',
    });
    const requestBody = options?.body;
    expect(typeof requestBody).toBe('string');
    if (typeof requestBody !== 'string') throw new Error('Expected JSON body');
    expect(requestBody).toContain('"model":"openrouter/free"');
    expect(requestBody).toContain('"content":"How should I begin?"');
    expect(requestBody).toContain('Never give a full solution');
    expect(requestBody).toContain('Synthetic addition');
    expect(requestBody).toContain('Add two numbers.');
    expect(requestBody).toContain('const total = 0;');
    expect(requestBody).toContain('What are the inputs?');
    expect(requestBody).not.toContain('Old complete code should stay out.');
    expect(requestBody).not.toContain('Private full solution.');
    expect(requestBody).not.toContain(
      'Add the two inputs and print the result.',
    );
  });

  it('keeps problem guidance available when the provider fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const service = new PetService({
      getProblemBySlug: jest.fn().mockResolvedValue({
        data: {
          title: 'Synthetic addition',
          inputFormat: 'Two integers.',
          hints: ['Read both inputs and print their sum.'],
        },
      }),
    } as unknown as ProblemsService);

    const result = await service.ask('test-user', {
      question: 'Hint please',
      problemSlug: 'synthetic-addition',
      history: [],
    });

    expect(result.source).toBe('local');
    expect(result.reply).toBe(
      'Start with the input format: Two integers. Which value should you read first?',
    );
    expect(result.notice).toContain('temporarily unavailable');
  });

  it('answers a request for full code with a hint without calling the model', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    const service = new PetService({
      getProblemBySlug: jest.fn().mockResolvedValue({
        data: {
          title: 'Synthetic addition',
          examples: [{ input: '2 3', output: '5' }],
          hints: ['Add both numbers and print the result.'],
          editorial: 'Full code goes here.',
        },
      }),
    } as unknown as ProblemsService);

    const result = await service.ask('test-user', {
      question: 'Give me the full code',
      problemSlug: 'synthetic-addition',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe('local');
    expect(result.reply).toContain('Trace the first sample input');
    expect(result.reply).not.toContain('Full code goes here.');
    expect(result.reply).not.toContain('Add both numbers');
  });

  it('discards model output containing a full code block', async () => {
    const providerResponse = new Response(
      JSON.stringify({
        choices: [{ message: { content: '```python\nprint(2 + 3)\n```' } }],
      }),
      { status: 200 },
    );
    jest.spyOn(global, 'fetch').mockResolvedValue(providerResponse);
    const service = new PetService({
      getProblemBySlug: jest.fn().mockResolvedValue({
        data: {
          title: 'Synthetic addition',
          examples: [{ input: '2 3', output: '5' }],
        },
      }),
    } as unknown as ProblemsService);

    const result = await service.ask('test-user', {
      question: 'Give me a hint',
      problemSlug: 'synthetic-addition',
    });

    expect(result.source).toBe('local');
    expect(result.reply).toContain('Trace the first sample input');
    expect(result.reply).not.toContain('print(');
    expect(result.notice).toContain('one hint at a time');
  });
});
