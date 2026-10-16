/**
 * Deterministic heuristic complexity analyzer for student solutions.
 *
 * Detects common patterns (loop nesting, halving, sorting, recursion) and
 * reports big-O estimates with a plain-English explanation. It is a teaching
 * aid, not a proof: keep `confidence` honest and the explanation pattern-based.
 */

export interface ComplexityAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

function stripCommentsAndStrings(code: string, isPython: boolean): string {
  let clean = code;
  if (!isPython) {
    // C-style comments. Skipped for Python, where // is integer division.
    clean = clean
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
  }
  return clean
    .replace(/#[^\n]*/g, '')
    .replace(/"""[\s\S]*?"""/g, '')
    .replace(/'''[\s\S]*?'''/g, '')
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '');
}

/** Loop nesting depth for brace-delimited languages (C, C++, Java, JS, TS). */
function braceLoopDepth(code: string): number {
  let depth = 0;
  let maxLoopDepth = 0;
  const tokens = code.split(/([{}]|for\s*\(|while\s*\(|do\s*\{)/g);
  for (const token of tokens) {
    if (/^(for\s*\(|while\s*\(|do\s*\{)$/.test(token)) {
      maxLoopDepth = Math.max(maxLoopDepth, depth + 1);
      if (token.startsWith('do')) depth++;
    } else if (token === '{') {
      depth++;
    } else if (token === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  return maxLoopDepth;
}

/** Loop nesting depth for indentation-scoped languages (Python). */
function pythonLoopDepth(code: string): number {
  let maxDepth = 0;
  const stack: number[] = [];
  for (const line of code.split('\n')) {
    const indent = line.match(/^\s*/)![0].replace(/\t/g, '  ').length;
    while (stack.length && indent <= stack[stack.length - 1]) stack.pop();
    if (/^\s*(for|while)\s+/.test(line)) {
      stack.push(indent);
      maxDepth = Math.max(maxDepth, stack.length);
    }
  }
  return maxDepth;
}

function hasHalving(code: string): boolean {
  return (
    /[*]=\s*2\b/.test(code) ||
    /\/{1,2}=\s*2\b/.test(code) ||
    />>=\s*1\b/.test(code) ||
    /\bmid\s*=\s*\(?[^;\n]+\)?\s*\/{1,2}\s*2\b/.test(code) ||
    /\b(left|right|lo|hi|low|high)\s*=\s*\(?[^;\n]*[+-][^;\n]*\)?\s*\/{1,2}\s*2\b/.test(
      code,
    )
  );
}

function hasSort(code: string): boolean {
  return /(\.sort\s*\(|\bsorted\s*\(|\bsort\s*\()/.test(code);
}

/** Linear traversal hidden in comprehensions and built-in iteration. */
function hasLinearIteration(code: string): boolean {
  return (
    /\[\s*[^\]]*\bfor\b[^\]]*\]/.test(code) ||
    /\.\b(map|filter|forEach|reduce|some|every|flatMap)\s*\(/.test(code) ||
    /\b(map|filter|reduce|sum|min|max)\s*\([^)]*\)/.test(code)
  );
}

interface RecursionInfo {
  depth: number; // 0 = none, 1 = linear-ish, 2+ = branching
  splits: boolean; // argument halved before recursive call
}

function detectRecursion(code: string, language: string): RecursionInfo {
  const defPattern =
    language === 'python'
      ? /(?:^|\n)\s*def\s+([A-Za-z_]\w*)\s*\(/g
      : /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:static\s+)?(?:public\s+|private\s+|protected\s+)?function\s+([A-Za-z_]\w*)\s*\(|(?:^|\n)\s*(?:public\s+|private\s+|protected\s+)?(?:static\s+)?[\w<>[\],\s]+\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
  const info: RecursionInfo = { depth: 0, splits: false };
  for (const match of code.matchAll(defPattern)) {
    const name = match[1] || match[2];
    if (!name) continue;
    const calls = (code.match(new RegExp(`\\b${name}\\s*\\(`, 'g')) || []).length - 1;
    if (calls <= 0) continue;
    info.depth = Math.max(info.depth, calls);
    if (new RegExp(`\\b${name}\\s*\\([^)]*\\/\\s*2\\b`).test(code)) info.splits = true;
  }
  return info;
}

function analyzeSpace(code: string, recursion: RecursionInfo, language: string): string {
  if (recursion.depth > 0) return 'O(n)';
  const accumulates = /(\.push\s*\(|\.append\s*\(|new Array\s*\[|\bArray\.from\s*\(|=\s*\[\])/.test(code);
  if (accumulates) return 'O(n)';
  return 'O(1)';
}

export function analyzeComplexity(
  code: string,
  language: string,
): ComplexityAnalysis {
  const lang = (language || '').toLowerCase();
  const isPython = ['python', 'python3', 'py'].includes(lang);
  const clean = stripCommentsAndStrings(code, isPython);

  const loopDepth = isPython ? pythonLoopDepth(clean) : braceLoopDepth(clean);
  const halving = hasHalving(clean);
  const sorted = hasSort(clean);
  const linearIteration = hasLinearIteration(clean);
  const recursion = detectRecursion(clean, lang);

  const patterns: string[] = [];
  let time: string;
  let confidence: ComplexityAnalysis['confidence'] = 'high';

  if (recursion.depth >= 2) {
    time = 'O(2ⁿ)';
    patterns.push(`branching recursion detected (${recursion.depth} recursive calls per invocation)`);
    confidence = 'medium';
  } else if (recursion.depth === 1) {
    time = recursion.splits ? 'O(log n)' : 'O(n)';
    patterns.push(`recursion with ${recursion.splits ? 'halved input at each step' : 'a single recursive call'}`);
    confidence = 'medium';
  } else if (loopDepth >= 3) {
    time = 'O(n³)';
    patterns.push(`${loopDepth} levels of nested loops`);
    confidence = 'high';
  } else if (loopDepth === 2) {
    time = 'O(n²)';
    patterns.push('nested loops');
    confidence = 'high';
  } else if (loopDepth === 1) {
    if (halving) {
      time = 'O(log n)';
      patterns.push('a loop that halves the search space each iteration');
      confidence = 'medium';
    } else if (sorted) {
      time = 'O(n log n)';
      patterns.push('a sort followed by a linear scan');
      confidence = 'medium';
    } else {
      time = 'O(n)';
      patterns.push('a single linear loop');
    }
  } else if (sorted) {
    time = 'O(n log n)';
    patterns.push('a sorting operation');
    confidence = 'medium';
  } else if (linearIteration) {
    time = 'O(n)';
    patterns.push('linear traversal via a built-in iteration construct');
    confidence = 'medium';
  } else {
    time = 'O(1)';
    patterns.push('no loops, recursion, or sorting — constant work');
  }

  const space = analyzeSpace(clean, recursion, lang);
  if (space === 'O(n)' && recursion.depth === 0) patterns.push('auxiliary storage that grows with the input');

  return {
    timeComplexity: time,
    spaceComplexity: space,
    explanation: `Estimated from the code structure: ${patterns.join('; ')}.`,
    confidence,
  };
}
