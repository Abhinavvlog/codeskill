import { CorrelationMiddleware } from './correlation.middleware';
import { RequestContextService } from './request-context.service';

describe('CorrelationMiddleware', () => {
  let middleware: CorrelationMiddleware;

  beforeEach(() => {
    middleware = new CorrelationMiddleware();
  });

  it('should generate a new traceId when none is provided in headers', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn(() => {
      const traceId = RequestContextService.getTraceId();
      expect(traceId).toBeDefined();
      expect(traceId).not.toBe('untraced-background-task');
      expect(req.headers['x-request-id']).toBe(traceId);
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', traceId);
    });

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reuse incoming x-request-id header', () => {
    const req: any = { headers: { 'x-request-id': 'incoming-client-trace-123' } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn(() => {
      expect(RequestContextService.getTraceId()).toBe('incoming-client-trace-123');
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'incoming-client-trace-123');
    });

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should passively extract userId from bearer JWT token without verifying', () => {
    // Generate an unsigned JWT payload { sub: 'usr-999', role: 'student' }
    const payload = Buffer.from(JSON.stringify({ sub: 'usr-999', role: 'student' })).toString('base64');
    const token = `header.${payload}.signature`;

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`,
        'x-request-id': 'trace-with-auth',
      },
      ip: '10.0.1.5',
      originalUrl: '/api/submissions',
    };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn(() => {
      expect(RequestContextService.getTraceId()).toBe('trace-with-auth');
      expect(RequestContextService.getUserId()).toBe('usr-999');
    });

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
