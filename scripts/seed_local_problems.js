const path = require('path');
const { randomUUID } = require('crypto');

const backend = path.join(__dirname, '../backend-nestjs');
require(path.join(backend, 'node_modules/dotenv')).config({
  path: path.join(backend, '.env'),
  quiet: true,
});
const { Pool } = require(path.join(backend, 'node_modules/pg'));
const Redis = require(path.join(backend, 'node_modules/ioredis'));

const sumSamples = [
  { input: '2 3\n', output: '5', explanation: '2 + 3 = 5.' },
  { input: '7 -2\n', output: '5', explanation: 'The second number can be negative.' },
  { input: '-4 -6\n', output: '-10', explanation: 'Both numbers can be negative.' },
];
const maxSamples = [
  { input: '5\n1 8 3 8 2\n', output: '8', explanation: 'The largest value is 8, even though it appears twice.' },
  { input: '3\n-8 -3 -6\n', output: '-3', explanation: 'The maximum can be negative.' },
  { input: '1\n42\n', output: '42', explanation: 'A one-element array has that element as its maximum.' },
];

const problems = [
  {
    title: 'Sum of Two Numbers',
    slug: 'sum-of-two-numbers',
    tags: ['Math'],
    description: '<p>Given two integers <code>a</code> and <code>b</code>, print their sum.</p><p>Read the numbers from standard input and write only the answer to standard output. The numbers may be positive, zero, or negative.</p>',
    inputFormat: 'One line containing two space-separated integers a and b.',
    outputFormat: 'Print one integer: a + b.',
    constraints: '<p>-10<sup>9</sup> &le; a, b &le; 10<sup>9</sup></p>',
    examples: sumSamples,
    cases: [
      ...sumSamples.map(sample => ({ ...sample, isHidden: false, weight: 1 })),
      { input: '0 0\n', output: '0', isHidden: true, weight: 1 },
      { input: '-1000000000 1000000000\n', output: '0', isHidden: true, weight: 1 },
      { input: '1000000000 1000000000\n', output: '2000000000', isHidden: true, weight: 1 },
      { input: '-1000000000 -1000000000\n', output: '-2000000000', isHidden: true, weight: 1 },
    ],
    hints: ['Read both integers, add them, and print the result without extra text.'],
    editorial: '<p>Read a and b, then print a + b. Time complexity: O(1). Auxiliary space: O(1).</p>',
    starterCode: {
      javascript: "const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\n// TODO: Calculate and print the sum of a and b.\n",
      python: 'import sys\na, b = map(int, sys.stdin.read().split())\n\n# TODO: Calculate and print the sum of a and b.\n',
      cpp: '#include <iostream>\nint main() {\n    long long a, b;\n    std::cin >> a >> b;\n    // TODO: Calculate and print the sum.\n    return 0;\n}\n',
      c: '#include <stdio.h>\nint main(void) {\n    long long a, b;\n    scanf("%lld %lld", &a, &b);\n    // TODO: Calculate and print the sum.\n    return 0;\n}\n',
      java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long a = sc.nextLong(), b = sc.nextLong();\n        // TODO: Calculate and print the sum.\n    }\n}\n',
    },
    referenceSolution: {
      javascript: "const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a + b);\n",
      python: 'import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)\n',
    },
  },
  {
    title: 'Maximum in an Array',
    slug: 'maximum-in-an-array',
    tags: ['Arrays'],
    description: '<p>Given an array of <code>n</code> integers, print its largest element.</p><p>The array can contain negative values and duplicates. Read from standard input and write only the maximum value to standard output.</p>',
    inputFormat: 'The first line contains n. The second line contains n space-separated integers.',
    outputFormat: 'Print the largest integer in the array.',
    constraints: '<p>1 &le; n &le; 1000</p><p>-10<sup>9</sup> &le; each array element &le; 10<sup>9</sup></p>',
    examples: maxSamples,
    cases: [
      ...maxSamples.map(sample => ({ ...sample, isHidden: false, weight: 1 })),
      { input: '4\n0 0 0 0\n', output: '0', isHidden: true, weight: 1 },
      { input: '4\n9 9 9 9\n', output: '9', isHidden: true, weight: 1 },
      { input: '2\n-1000000000 1000000000\n', output: '1000000000', isHidden: true, weight: 1 },
      { input: '5\n5 4 3 2 1\n', output: '5', isHidden: true, weight: 1 },
    ],
    hints: ['Initialize the maximum with the first element so all-negative arrays work.', 'Compare every remaining element with your current maximum.'],
    editorial: '<p>Start with the first element as the maximum. Scan the remaining elements and replace the maximum whenever you find a larger value. Time complexity: O(n). Auxiliary space: O(1) while scanning.</p>',
    starterCode: {
      javascript: "const fs = require('fs');\nconst values = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = values[0];\nconst numbers = values.slice(1, n + 1);\n\n// TODO: Find and print the largest element.\n",
      python: 'import sys\nvalues = list(map(int, sys.stdin.read().split()))\nn = values[0]\nnumbers = values[1:n + 1]\n\n# TODO: Find and print the largest element.\n',
      cpp: '#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    std::cin >> n;\n    std::vector<long long> numbers(n);\n    for (auto &value : numbers) std::cin >> value;\n    // TODO: Find and print the largest element.\n    return 0;\n}\n',
      c: '#include <stdio.h>\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    long long numbers[1000];\n    for (int i = 0; i < n; i++) scanf("%lld", &numbers[i]);\n    // TODO: Find and print the largest element.\n    return 0;\n}\n',
      java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long[] numbers = new long[n];\n        for (int i = 0; i < n; i++) numbers[i] = sc.nextLong();\n        // TODO: Find and print the largest element.\n    }\n}\n',
    },
    referenceSolution: {
      javascript: "const fs = require('fs');\nconst values = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet maximum = values[1];\nfor (let i = 2; i <= values[0]; i++) maximum = Math.max(maximum, values[i]);\nconsole.log(maximum);\n",
      python: 'import sys\nvalues = list(map(int, sys.stdin.read().split()))\nprint(max(values[1:values[0] + 1]))\n',
    },
  },
];

async function main() {
  const url = new URL(process.env.DATABASE_URL || '');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.pathname !== '/codeskill') {
    throw new Error('This seed script only supports the local codeskill database.');
  }
  const pool = new Pool({ connectionString: url.toString() });
  const client = await pool.connect();
  try {
    const author = await client.query('SELECT id FROM users WHERE email=$1 AND "isAdmin"=true', ['local.admin@codeskill.com']);
    if (!author.rowCount) throw new Error('The local administrator account is missing.');
    await client.query('BEGIN');
    for (const problem of problems) {
      const exists = await client.query('SELECT id FROM problems WHERE slug=$1 UNION SELECT id FROM problem_metadata WHERE slug=$1', [problem.slug]);
      if (exists.rowCount) {
        console.log(`Already exists, leaving unchanged: ${problem.title}`);
        continue;
      }
      const id = randomUUID();
      const languages = Object.keys(problem.starterCode);
      const stats = { totalSubmissions: 0, acceptedSubmissions: 0, acceptanceRate: 0 };
      await client.query(
        'INSERT INTO problems (id,title,slug,description,"inputFormat","outputFormat",examples,visibility,difficulty,constraints,tags,"supportedLanguages","starterCode","testCases",hints,editorial,stats,"isPublished") VALUES ($1,$2,$3,$4,$5,$6,$7,\'Published\',\'Easy\',$8,$9,$10,$11,$12,$13,$14,$15,true)',
        [id,problem.title,problem.slug,problem.description,problem.inputFormat,problem.outputFormat,JSON.stringify(problem.examples),problem.constraints,problem.tags,languages,JSON.stringify(problem.starterCode),JSON.stringify(problem.cases),problem.hints,problem.editorial,JSON.stringify(stats)],
      );
      await client.query(
        'INSERT INTO problem_metadata (id,title,slug,difficulty,categories,tags,author_id,visibility,stats) VALUES ($1,$2,$3,\'Easy\',$4,$5,$6,\'Published\',$7)',
        [id,problem.title,problem.slug,JSON.stringify(problem.tags),JSON.stringify(problem.tags),author.rows[0].id,JSON.stringify(stats)],
      );
      await client.query(
        'INSERT INTO problem_statements (id,metadata_id,description,"inputFormat","outputFormat",constraints,samples) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [randomUUID(),id,problem.description,problem.inputFormat,problem.outputFormat,problem.constraints,JSON.stringify(problem.examples)],
      );
      await client.query(
        'INSERT INTO problem_configs (id,metadata_id,"supportedLanguages","starterCode","referenceSolution") VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(),id,JSON.stringify(languages),JSON.stringify(problem.starterCode),JSON.stringify(problem.referenceSolution)],
      );
      await client.query('INSERT INTO problem_testcases (id,metadata_id,cases) VALUES ($1,$2,$3)', [randomUUID(),id,JSON.stringify(problem.cases)]);
      console.log(`Created: ${problem.title} (Easy, ${problem.cases.length} test cases)`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
  const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: 1 });
  try {
    const keys = await redis.keys('problems:*');
    for (const problem of problems) keys.push(`problem:${problem.slug}`);
    if (keys.length) await redis.del(...keys);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { problems };
