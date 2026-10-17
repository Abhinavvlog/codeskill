import { RequestContextService, RequestStore } from './request-context.service';

describe('RequestContextService', () => {
  it('should return fallback traceId when out of context', () => {
    expect(RequestContextService.getTraceId()).toBe('untraced-background-task');
    expect(RequestContextService.getUserId()).toBeUndefined();
    expect(RequestContextService.getStore()).toBeUndefined();
  });

  it('should store and retrieve context inside run callback', () => {
    const store: RequestStore = {
      traceId: 'trace-12345',
      userId: 'user-abc',
      role: 'student',
      ip: '127.0.0.1',
      path: '/api/problems',
      startTime: process.hrtime.bigint(),
    };

    RequestContextService.run(store, () => {
      expect(RequestContextService.getTraceId()).toBe('trace-12345');
      expect(RequestContextService.getUserId()).toBe('user-abc');
      expect(RequestContextService.getStore()).toEqual(store);
    });

    // Verify context does not leak outside run
    expect(RequestContextService.getTraceId()).toBe('untraced-background-task');
  });

  it('should maintain independent contexts across concurrent async flows', async () => {
    const taskA = new Promise<string>((resolve) => {
      RequestContextService.run(
        { traceId: 'trace-A', startTime: process.hrtime.bigint() },
        () => {
          setTimeout(() => {
            resolve(RequestContextService.getTraceId());
          }, 10);
        },
      );
    });

    const taskB = new Promise<string>((resolve) => {
      RequestContextService.run(
        { traceId: 'trace-B', startTime: process.hrtime.bigint() },
        () => {
          setTimeout(() => {
            resolve(RequestContextService.getTraceId());
          }, 5);
        },
      );
    });

    const [resultA, resultB] = await Promise.all([taskA, taskB]);
    expect(resultA).toBe('trace-A');
    expect(resultB).toBe('trace-B');
  });
});
