import { resolveAllowedCorsOrigins, isOriginAllowed } from './cors.util';

describe('CORS Utility (AUD-004)', () => {
  describe('resolveAllowedCorsOrigins', () => {
    it('returns empty array in production if wildcard is specified', () => {
      const origins = resolveAllowedCorsOrigins({
        NODE_ENV: 'production',
        CORS_ORIGIN: '*',
      });
      expect(origins).toEqual([]);
    });

    it('returns explicit origins split by comma in production', () => {
      const origins = resolveAllowedCorsOrigins({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://codeskill.example.com, https://app.codeskill.example.com',
      });
      expect(origins).toEqual([
        'https://codeskill.example.com',
        'https://app.codeskill.example.com',
      ]);
    });

    it('falls back to FRONTEND_URL or CLIENT_URL', () => {
      const origins = resolveAllowedCorsOrigins({
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://codeskill.io',
      });
      expect(origins).toEqual(['https://codeskill.io']);
    });

    it('defaults to localhost origins in development when unset', () => {
      const origins = resolveAllowedCorsOrigins({
        NODE_ENV: 'development',
      });
      expect(origins).toContain('http://localhost:3000');
    });
  });

  describe('isOriginAllowed', () => {
    it('allows requests with missing origin (server-to-server / curl)', () => {
      expect(isOriginAllowed(undefined, ['https://codeskill.io'], true)).toBe(true);
    });

    it('rejects unapproved origin in production', () => {
      expect(
        isOriginAllowed(
          'https://malicious-site.com',
          ['https://codeskill.io'],
          true,
        ),
      ).toBe(false);
    });

    it('allows approved origin in production', () => {
      expect(
        isOriginAllowed(
          'https://codeskill.io',
          ['https://codeskill.io'],
          true,
        ),
      ).toBe(true);
    });

    it('allows localhost origins in development mode', () => {
      expect(
        isOriginAllowed(
          'http://localhost:4000',
          ['http://localhost:3000'],
          false,
        ),
      ).toBe(true);
    });

    it('blocks arbitrary external origins in production when allowed list is empty', () => {
      expect(isOriginAllowed('https://evil.com', [], true)).toBe(false);
    });
  });
});
