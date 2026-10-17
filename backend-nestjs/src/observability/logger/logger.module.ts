import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { RequestContextService } from '../context/request-context.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: () => {
        const targets: any[] = [
          // Always output single-line JSON to stdout for local resilience
          {
            target: 'pino/file',
            level: process.env.LOG_LEVEL || 'info',
            options: { destination: 1 },
          },
        ];

        // Enable Axiom Free Tier transport only when token is configured
        if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
          const axiomTarget = (() => {
            try {
              return require.resolve('@axiomhq/pino');
            } catch {
              return '@axiomhq/pino';
            }
          })();

          targets.push({
            target: axiomTarget,
            level: process.env.LOG_LEVEL || 'info',
            options: {
              dataset: process.env.AXIOM_DATASET,
              token: process.env.AXIOM_TOKEN,
              orgId: process.env.AXIOM_ORG_ID,
              edgeUrl:
                process.env.AXIOM_EDGE_URL ||
                'https://eu-central-1.aws.edge.axiom.co',
            },
          });
        }

        return {
          pinoHttp: {
            level: process.env.LOG_LEVEL || 'info',
            quietReqLogger: true, // Avoid duplicate request logs
            genReqId: (req) =>
              (req.headers['x-request-id'] as string) ||
              RequestContextService.getTraceId(),
            customProps: (req) => ({
              service: process.env.SERVICE_NAME || 'codeskill-backend',
              environment: process.env.NODE_ENV || 'production',
              traceId:
                req.headers['x-request-id'] ||
                RequestContextService.getTraceId(),
              userId: (req as any).user?.id || RequestContextService.getUserId(),
            }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                '*.password',
                '*.temporaryPassword',
                '*.token',
                '*.accessToken',
                '*.refreshToken',
                '*.secret',
                '*.mfaSecret',
                '*.creditCard',
                '*.ssn',
              ],
              censor: '[REDACTED]',
            },
            // Do not log noisy health or metrics scrapes to conserve Axiom Free Tier quota
            autoLogging: {
              ignore: (req) =>
                req.url?.startsWith('/health') ||
                req.url?.startsWith('/api/metrics') ||
                false,
            },
            transport: targets.length > 1 ? { targets } : targets[0],
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class StructuredLoggerModule {}
