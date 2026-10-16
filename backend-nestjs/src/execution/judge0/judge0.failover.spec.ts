import { ExecutionService, Status } from '../execution.service';
import { PistonUnavailableError } from '../piston/piston.types';

describe('Judge0 primary and Piston fallback', () => {
  const original = process.env.CODE_EXECUTION_PROVIDER;
  const primary = {
    execute: jest.fn(),
    config: { outputLimit: 65536, testCaseConcurrency: 2 },
    metrics: jest.fn(),
  };
  const secondary = {
    execute: jest.fn(),
    config: { outputLimit: 65536, testCaseConcurrency: 2 },
    metrics: jest.fn(),
  };
  let service: ExecutionService;
  const run = () =>
    service.executeCode('python', 'print(5)', [
      { id: 1, input: '2 3', expected: '5' },
    ]);
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CODE_EXECUTION_PROVIDER = 'judge0';
    primary.execute.mockResolvedValue({
      status: { id: 3 },
      stdout: '5\n',
      stderr: null,
      compile_output: null,
      time: '0.002',
      memory: 1024,
    });
    secondary.execute.mockResolvedValue({
      run: { stdout: '5\n', stderr: '', output: '5\n', code: 0, signal: null },
    });
    service = new ExecutionService(secondary as never, primary as never);
  });
  afterAll(() => {
    if (original === undefined) delete process.env.CODE_EXECUTION_PROVIDER;
    else process.env.CODE_EXECUTION_PROVIDER = original;
  });
  it('uses Judge0 first and converts seconds/KiB to milliseconds/MiB', async () => {
    const [result] = await run();
    expect(result).toEqual(
      expect.objectContaining({
        passed: true,
        status: Status.ACCEPTED,
        executionTime: 2,
        memoryUsed: 1,
      }),
    );
    expect(secondary.execute).not.toHaveBeenCalled();
    expect(primary.execute).toHaveBeenCalledWith(
      'python',
      'print(5)',
      '2 3',
      expect.any(Object),
    );
  });
  it('falls back when the primary transport, capacity, or sandbox is unavailable', async () => {
    primary.execute.mockRejectedValue(new PistonUnavailableError());
    expect((await run())[0].status).toBe(Status.ACCEPTED);
    expect(secondary.execute).toHaveBeenCalledTimes(1);
    expect(service.executionMetrics().failovers).toBe(1);
  });
  it('adapts named Java entry classes for Judge0 without renaming constructors or string literals', async () => {
    await service.executeCode(
      'java',
      'public class Solution { Solution() {} public static void main(String[] args) { System.out.println("Solution"); } }',
      [{ id: 1, input: '', expected: 'Solution' }],
    );
    const source = primary.execute.mock.calls[0][1];
    expect(source).toContain('class Solution { Solution() {}');
    expect(source).toContain('System.out.println("Solution")');
    expect(source).toContain('Solution.main(args)');
    expect(source).not.toContain('public class Solution');
  });
  it.each([
    [4, Status.WRONG_ANSWER],
    [5, Status.TIME_LIMIT_EXCEEDED],
    [6, Status.COMPILATION_ERROR],
    [7, Status.RUNTIME_ERROR],
  ])(
    'does not retry student verdict %s on another judge',
    async (id, status) => {
      primary.execute.mockResolvedValue({
        status: { id },
        stdout: '',
        stderr: 'student error',
        compile_output: null,
        time: null,
        memory: null,
      });
      expect((await run())[0].status).toBe(status);
      expect(secondary.execute).not.toHaveBeenCalled();
    },
  );
  it('fails as infrastructure failure if both providers are unavailable', async () => {
    primary.execute.mockRejectedValue(new PistonUnavailableError());
    secondary.execute.mockRejectedValue(new PistonUnavailableError());
    await expect(run()).rejects.toBeInstanceOf(PistonUnavailableError);
  });
  it('stops scheduling the same compilation failure across every test case', async () => {
    primary.execute.mockResolvedValue({
      status: { id: 6 },
      stdout: '',
      stderr: null,
      compile_output: 'main.cpp: syntax error',
      time: null,
      memory: null,
    });
    const tests = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      input: String(i),
      expected: String(i + 1),
    }));
    const results = await service.executeCode('cpp', 'invalid source', tests);
    expect(primary.execute).toHaveBeenCalledTimes(2);
    expect(secondary.execute).not.toHaveBeenCalled();
    expect(results).toHaveLength(7);
    expect(results.map((r) => r.id)).toEqual(tests.map((t) => t.id));
    expect(results.every((r) => r.status === Status.COMPILATION_ERROR)).toBe(
      true,
    );
    expect(results[6]).toMatchObject({
      expected: '7',
      error: 'main.cpp: syntax error',
    });
    expect(results[6].executionTime).toBeUndefined();
    expect(results[6].memoryUsed).toBeUndefined();
  });
  it('uses fallback for remaining cases after an outage and tries primary again on the next request', async () => {
    primary.execute.mockRejectedValue(new PistonUnavailableError());
    const tests = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      input: String(i),
      expected: '5',
    }));
    const results = await service.executeCode('python', 'print(5)', tests);
    expect(results.every((r) => r.passed)).toBe(true);
    expect(primary.execute).toHaveBeenCalledTimes(2);
    expect(secondary.execute).toHaveBeenCalledTimes(7);
    primary.execute.mockResolvedValue({
      status: { id: 3 },
      stdout: '5',
      time: null,
      memory: null,
    });
    expect((await run())[0].passed).toBe(true);
    expect(primary.execute).toHaveBeenCalledTimes(3);
    expect(secondary.execute).toHaveBeenCalledTimes(7);
  });
  it('continues checking every case for valid compilations and wrong answers', async () => {
    const results = await service.executeCode(
      'cpp',
      'source',
      Array.from({ length: 7 }, (_, i) => ({
        input: String(i),
        expected: i === 6 ? '6' : '5',
      })),
    );
    expect(primary.execute).toHaveBeenCalledTimes(7);
    expect(results.filter((r) => r.passed)).toHaveLength(6);
    expect(results[6].status).toBe(Status.WRONG_ANSWER);
  });
  it('completes on a smaller fallback without exhausting its own slots and restarting the job', async () => {
    const fallback = {
      ...secondary,
      config: { ...secondary.config, globalConcurrency: 1 },
    };
    primary.execute.mockRejectedValue(new PistonUnavailableError());
    let active = 0;
    let peak = 0;
    secondary.execute.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      return {
        run: { stdout: '5', stderr: '', output: '5', code: 0, signal: null },
      };
    });
    service = new ExecutionService(fallback as never, primary as never);
    const results = await service.executeCode(
      'python',
      'print(5)',
      Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        input: '',
        expected: '5',
      })),
    );
    expect(results.every((r) => r.passed)).toBe(true);
    expect(peak).toBe(1);
    expect(secondary.execute).toHaveBeenCalledTimes(7);
    expect(primary.execute).toHaveBeenCalledTimes(1);
  });
  it('drains in-flight cases before reporting failure and freeing a user reservation', async () => {
    let finish!: (value: unknown) => void;
    primary.execute.mockImplementation((_language, _source, stdin: string) =>
      stdin === 'first'
        ? Promise.reject(new PistonUnavailableError())
        : new Promise((resolve) => {
            finish = resolve;
          }),
    );
    secondary.execute.mockRejectedValue(new PistonUnavailableError());
    let settled = false;
    const execution = service
      .executeCode('python', 'print(5)', [
        { input: 'first', expected: '5' },
        { input: 'second', expected: '5' },
      ])
      .catch(() => {
        settled = true;
      });
    await new Promise((resolve) => setImmediate(resolve));
    expect(settled).toBe(false);
    finish({
      status: { id: 3 },
      stdout: '5',
      stderr: null,
      compile_output: null,
      time: null,
      memory: null,
    });
    await execution;
    expect(settled).toBe(true);
  });
});
