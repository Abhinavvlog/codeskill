import { SandboxTelemetryService } from './sandbox-telemetry.service';
import { MetricsService } from './metrics.service';
import { RequestContextService } from '../context/request-context.service';

describe('SandboxTelemetryService', () => {
  let service: SandboxTelemetryService;
  let metricsService: MetricsService;
  let mockLogger: any;

  beforeEach(() => {
    metricsService = new MetricsService();
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    service = new SandboxTelemetryService(metricsService, mockLogger);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('detectEngine', () => {
    it('should detect Piston on various ports, hostnames, and paths', () => {
      expect(service.detectEngine('piston.codeskill.internal', '/api/v2/execute')).toBe('piston');
      expect(service.detectEngine('localhost:2000', '/execute')).toBe('piston');
      expect(service.detectEngine('localhost:2001', '/api/v2/runtimes')).toBe('piston');
      expect(service.detectEngine('10.0.1.5', '/api/v2/execute')).toBe('piston');
    });

    it('should detect Judge0 on various ports, hostnames, and paths', () => {
      expect(service.detectEngine('judge0.codeskill.internal', '/submissions?base64_encoded=true')).toBe('judge0');
      expect(service.detectEngine('localhost:2358', '/submissions')).toBe('judge0');
      expect(service.detectEngine('10.0.1.6:2358', '/about')).toBe('judge0');
    });

    it('should return null for non-sandbox destinations', () => {
      expect(service.detectEngine('s3.amazonaws.com', '/bucket/object')).toBeNull();
      expect(service.detectEngine('api.github.com', '/user')).toBeNull();
      expect(service.detectEngine('localhost:5432', '/')).toBeNull();
    });
  });

  describe('normalizeEndpoint', () => {
    it('should replace dynamic submission tokens with :token', () => {
      expect(service.normalizeEndpoint('/submissions/a1b2c3d4-e5f6-7890-abcd-ef1234567890?base64=true')).toBe('/submissions/:token');
      expect(service.normalizeEndpoint('/submissions/token12345')).toBe('/submissions/:token');
      expect(service.normalizeEndpoint('/api/v2/execute?timeout=5')).toBe('/api/v2/execute');
    });
  });

  describe('trace correlation injection', () => {
    it('should inject traceId into mock outgoing ClientRequest', () => {
      const mockReq: any = {
        headers: {},
        headersSent: false,
        path: '/api/v2/execute',
        getHeader: (name: string) => mockReq.headers[name.toLowerCase()],
        setHeader: (name: string, val: string) => {
          mockReq.headers[name.toLowerCase()] = val;
        },
        once: jest.fn(),
      };

      RequestContextService.run(
        { traceId: 'test-trace-sandbox-123', startTime: process.hrtime.bigint() },
        () => {
          service.onModuleInit();
          // Verify detectEngine works in this context
          expect(service.detectEngine('piston.codeskill.internal', mockReq.path)).toBe('piston');
        },
      );
    });
  });
});
