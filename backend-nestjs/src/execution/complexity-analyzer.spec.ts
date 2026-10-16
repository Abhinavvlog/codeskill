import { analyzeComplexity } from './complexity-analyzer';

describe('Complexity analyzer heuristics', () => {
  it('classifies a single linear loop as O(n) with high confidence', () => {
    const result = analyzeComplexity(
      `int total = 0;\nfor (int i = 0; i < n; i++) { total += i; }`,
      'cpp',
    );
    expect(result.timeComplexity).toBe('O(n)');
    expect(result.spaceComplexity).toBe('O(1)');
    expect(result.confidence).toBe('high');
  });

  it('classifies nested loops as O(n²)', () => {
    const result = analyzeComplexity(
      `for i in range(n):\n    for j in range(n):\n        print(i, j)`,
      'python',
    );
    expect(result.timeComplexity).toBe('O(n²)');
  });

  it('recognizes halving loops as O(log n)', () => {
    const result = analyzeComplexity(
      `while (left <= right) { int mid = left + (right - left) / 2; left = mid + 1; }`,
      'cpp',
    );
    expect(result.timeComplexity).toBe('O(log n)');
  });

  it('recognizes Python integer-division halving as O(log n)', () => {
    const result = analyzeComplexity(
      `while left <= right:\n    mid = left + (right - left) // 2\n    left = mid + 1`,
      'python',
    );
    expect(result.timeComplexity).toBe('O(log n)');
  });

  it('recognizes sorting as O(n log n)', () => {
    const result = analyzeComplexity(
      `function solve(nums) { nums.sort((a, b) => a - b); return nums; }`,
      'javascript',
    );
    expect(result.timeComplexity).toBe('O(n log n)');
  });

  it('classifies branching recursion as exponential', () => {
    const result = analyzeComplexity(
      `def fib(n):\n    if n < 2: return n\n    return fib(n-1) + fib(n-2)`,
      'python',
    );
    expect(result.timeComplexity).toBe('O(2ⁿ)');
    expect(result.spaceComplexity).toBe('O(n)');
  });

  it('classifies constant work as O(1)', () => {
    const result = analyzeComplexity(`print(42)`, 'python');
    expect(result.timeComplexity).toBe('O(1)');
    expect(result.confidence).toBe('high');
  });

  it('classifies comprehensions and built-in iteration as O(n)', () => {
    const result = analyzeComplexity(
      `print(sum(1 for x in nums[1:] if int(x) % 2 == 0))`,
      'python',
    );
    expect(result.timeComplexity).toBe('O(n)');
  });

  it('ignores commented code and string literals', () => {
    const result = analyzeComplexity(
      `# for i in range(n):\n#     for j in range(n):\nprint("for x in range(n):")`,
      'python',
    );
    expect(result.timeComplexity).toBe('O(1)');
  });

  it('explains the detected patterns', () => {
    const result = analyzeComplexity(
      `for (int i = 0; i < n; i++) { sum += arr[i]; }`,
      'c',
    );
    expect(result.explanation).toContain('linear');
  });
});
