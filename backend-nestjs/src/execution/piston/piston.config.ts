function integer(
  name: string,
  fallback: number,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`Invalid ${name}`);
  return value;
}
export function pistonConfig() {
  const baseURL = process.env.PISTON_BASE_URL || 'http://piston:2000/api/v2';
  const url = new URL(baseURL);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Invalid PISTON_BASE_URL');
  const runTimeout = integer('PISTON_DEFAULT_RUN_TIMEOUT_MS', 3000, 100, 60000);
  const compileTimeout = integer(
    'PISTON_DEFAULT_COMPILE_TIMEOUT_MS',
    10000,
    100,
    60000,
  );
  const requestTimeout = integer(
    'PISTON_REQUEST_TIMEOUT_MS',
    15000,
    1000,
    180000,
  );
  if (requestTimeout <= runTimeout + compileTimeout)
    throw new Error(
      'PISTON_REQUEST_TIMEOUT_MS must exceed compile plus run limits',
    );
  const versions: unknown = JSON.parse(
    process.env.PISTON_RUNTIME_VERSIONS || '{}',
  );
  if (
    !versions ||
    typeof versions !== 'object' ||
    Array.isArray(versions) ||
    Object.values(versions).some(
      (v) => typeof v !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(v),
    )
  )
    throw new Error('PISTON_RUNTIME_VERSIONS requires exact versions');
  return {
    baseURL: baseURL.replace(/\/$/, ''),
    runTimeout,
    compileTimeout,
    requestTimeout,
    concurrency: integer('PISTON_MAX_CONCURRENT_EXECUTIONS', 10, 1, 100),
    memory: integer(
      'PISTON_DEFAULT_MEMORY_LIMIT_BYTES',
      268435456,
      33554432,
      1073741824,
    ),
    compileMemory: integer(
      'PISTON_COMPILE_MEMORY_LIMIT_BYTES',
      536870912,
      33554432,
      2147483648,
    ),
    cacheTtl: integer('PISTON_RUNTIME_CACHE_TTL_MS', 60000, 1000, 3600000),
    outputLimit: integer('PISTON_OUTPUT_LIMIT_BYTES', 65536, 1024, 262144),
    versions: versions as Record<string, string>,
  };
}
