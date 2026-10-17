import { of, throwError } from 'rxjs';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
    interceptor = new HttpMetricsInterceptor(metricsService);
  });

  afterEach(async () => {
    await metricsService.onModuleDestroy();
  });

  it('should record HTTP request counter and duration histogram with normalized route', (done) => {
    const incSpy = jest.spyOn(metricsService.httpRequestsTotal, 'inc');
    const observeSpy = jest.spyOn(metricsService.httpRequestDuration, 'observe');

    const mockReq = {
      method: 'GET',
      originalUrl: '/api/submissions/3b827e1f-1234-5678-90ab-cdef12345678',
      route: { path: '/api/submissions/:id' },
    };
    const mockRes = { statusCode: 200 };

    const mockContext: any = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    };

    const nextHandler: any = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockContext, nextHandler).subscribe({
      next: () => {
        expect(incSpy).toHaveBeenCalledWith({
          method: 'GET',
          route: '/api/submissions/:id',
          status_code: '200',
        });
        expect(observeSpy).toHaveBeenCalledWith(
          {
            method: 'GET',
            route: '/api/submissions/:id',
            status_code: '200',
          },
          expect.any(Number),
        );
        done();
      },
    });
  });

  it('should skip metrics for self-scraping endpoints like /api/metrics and /health', (done) => {
    const incSpy = jest.spyOn(metricsService.httpRequestsTotal, 'inc');

    const mockReq = {
      method: 'GET',
      originalUrl: '/api/metrics',
    };

    const mockContext: any = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    };

    const nextHandler: any = {
      handle: () => of('metrics_data'),
    };

    interceptor.intercept(mockContext, nextHandler).subscribe({
      next: (val) => {
        expect(val).toBe('metrics_data');
        expect(incSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
