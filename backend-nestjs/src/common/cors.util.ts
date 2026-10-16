/**
 * Resolves allowed CORS origins from environment variables.
 * In production:
 *   - Returns explicitly configured origins from CORS_ORIGIN, FRONTEND_URL, or CLIENT_URL.
 *   - Wildcard '*' is strictly forbidden and rejected.
 *   - If no valid origin is configured in production, returns an empty array (rejects all external origins).
 * In non-production:
 *   - Defaults to local development origins (localhost:3000, 3001, etc.).
 */
export function resolveAllowedCorsOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const configured = env.CORS_ORIGIN || env.FRONTEND_URL || env.CLIENT_URL;
  if (configured && configured !== '*') {
    return configured
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (env.NODE_ENV === 'production') {
    return [];
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
}

/**
 * Checks whether a given origin is allowed under CORS policy.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  isProduction: boolean = process.env.NODE_ENV === 'production',
): boolean {
  // Allow requests without Origin (e.g. server-to-server, curl, mobile native apps)
  if (!origin) {
    return true;
  }

  if (!isProduction) {
    // In development/test, allow localhost ports and 127.0.0.1
    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return true;
    }
  }

  return allowedOrigins.includes(origin);
}
