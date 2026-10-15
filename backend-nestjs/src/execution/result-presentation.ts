import { TestCaseResult } from './execution.types';

export interface VisibleTestResult {
  id: string | number;
  passed: boolean;
  status: string;
  isHidden: boolean;
  executionTime?: number;
  memoryUsed?: number;
  input?: string;
  output?: string;
  expected?: string;
  error?: string;
}

/** Allow-list fields: hidden stdout/stderr can echo the entire test input. */
export function presentTestResults(
  results: TestCaseResult[],
  tests: Array<{ input: string; expected: string; isHidden?: boolean }>,
  context: 'practice' | 'assessment',
): VisibleTestResult[] {
  return results.map((result, index) => {
    const test = tests[index];
    const summary: VisibleTestResult = {
      id: result.id,
      passed: result.passed,
      status: result.status,
      isHidden: test?.isHidden === true,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
    };
    const reveal =
      test && (context === 'practice' ? !result.passed : !test.isHidden);
    return reveal
      ? {
          ...summary,
          input: test.input,
          expected: test.expected,
          output: result.output,
          error: result.error,
        }
      : summary;
  });
}

export function executionMetrics(results: TestCaseResult[]) {
  return {
    runtime:
      results.length && results.every((r) => Number.isFinite(r.executionTime))
        ? results.reduce((sum, r) => sum + r.executionTime!, 0)
        : undefined,
    memory:
      results.length && results.every((r) => Number.isFinite(r.memoryUsed))
        ? Math.max(...results.map((r) => r.memoryUsed!))
        : undefined,
  };
}

export function scoreComparison(
  passed: number,
  peers: Array<{ passed: number; count: number }>,
) {
  const sampleSize = peers.reduce((sum, peer) => sum + Number(peer.count), 0);
  if (!sampleSize) return null;
  const below = peers
    .filter((peer) => Number(peer.passed) < passed)
    .reduce((sum, peer) => sum + Number(peer.count), 0);
  return {
    percentile: Math.round((below / sampleSize) * 1000) / 10,
    sampleSize,
  };
}
