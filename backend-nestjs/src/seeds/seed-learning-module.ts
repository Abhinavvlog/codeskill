import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminLearningService } from '../learning/services/admin-learning.service';

async function bootstrap() {
  console.log('Bootstrapping CodeSkill Learning Platform Starter Curriculum...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminLearningService);

  // 1. Seed Badges
  const badges = [
    {
      code: 'FIRST_SOLUTION',
      name: 'First Solution',
      description: 'Passed your first coding or quiz exercise in a learning course.',
      iconUrl: '/images/badges/first-solution.svg',
      rarity: 'common' as const,
      category: 'milestone' as const,
      criteria: { type: 'problem_solved', count: 1 },
    },
    {
      code: 'KNOWLEDGE_SEEKER',
      name: 'Knowledge Seeker',
      description: 'Completed your first 5 structured reading lessons.',
      iconUrl: '/images/badges/knowledge-seeker.svg',
      rarity: 'common' as const,
      category: 'skills' as const,
      criteria: { type: 'lesson_completed', count: 5 },
    },
    {
      code: 'PATH_CHAMPION',
      name: 'Path Champion',
      description: 'Completed an entire learning path curriculum and received certification.',
      iconUrl: '/images/badges/path-champion.svg',
      rarity: 'epic' as const,
      category: 'mastery' as const,
      criteria: { type: 'path_completed' },
    },
    {
      code: 'ALGORITHM_MASTER',
      name: 'Algorithm Master',
      description: 'Mastered algorithmic foundations across searching, sorting, and dynamic programming.',
      iconUrl: '/images/badges/algo-master.svg',
      rarity: 'legendary' as const,
      category: 'skills' as const,
      criteria: { type: 'algo_mastery' },
    },
  ];

  for (const b of badges) {
    try {
      await adminService.createBadge(b);
      console.log(`Badge seeded: ${b.name}`);
    } catch {
      // Ignored if exists
    }
  }

  // 2. Seed Default Certificate Template
  try {
    await adminService.createCertificateTemplate({
      name: 'Standard CodeSkill Digital Credential',
      title: 'Certificate of Verified Mastery',
      issuerName: 'Technical Training Team',
      issuerTitle: 'Head of Technical Training & Development',
      issuerOrganization: 'CodeSkill · Chandigarh University',
      isDefault: true,
    });
    console.log('Certificate template seeded.');
  } catch {
    // Ignored if exists
  }

  // 3. Seed Course 1: JavaScript Foundations
  let course1;
  try {
    course1 = await adminService.createCourse({
      title: 'JavaScript Foundations & Variables',
      slug: 'javascript-foundations',
      description: 'Master variables, primitive data types, scope, and basic operators in modern ECMAScript.',
      difficulty: 'beginner',
      estimatedMinutes: 45,
      status: 'published',
    });
    console.log(`Course seeded: ${course1.title}`);

    // Module 1
    const mod1 = await adminService.createModule(course1.id, {
      title: 'Module 1: Variables, Constants & Scoping',
      description: 'Understand let, const, var, memory models, and hoisting.',
      order: 1,
    });

    // Lesson 1: Text-based reading with code examples (NO VIDEO)
    const l1 = await adminService.createLesson(mod1.id, {
      title: 'Declaring Variables: let vs const',
      slug: 'declaring-variables',
      order: 1,
      type: 'reading',
      content: `### Understanding Variables in Modern JavaScript

In modern JavaScript (ES6+), variable declaration is handled primarily with **\`let\`** and **\`const\`**. The legacy \`var\` keyword has distinct function-scoped semantics and should generally be avoided in modern codebases.

#### 1. \`const\` — Block-Scoped Immutability of Binding

Use \`const\` by default whenever a variable's binding will not be reassigned:

\`\`\`javascript
const university = "Chandigarh University";
const platform = "CodeSkill";

// Reassigning will throw a TypeError:
// university = "Other"; // Uncaught TypeError: Assignment to constant variable.
\`\`\`

> **Important:** While the *binding* is immutable, mutable data structures such as Objects and Arrays declared with \`const\` can still have their contents modified:

\`\`\`javascript
const student = { name: "Alice", role: "Engineer" };
student.role = "Architect"; // Valid!
\`\`\`

#### 2. \`let\` — Reassignable Block-Scoped Variables

Use \`let\` only when you expect the value to change over time, such as loop counters or accumulator variables:

\`\`\`javascript
let totalSubmissions = 0;
totalSubmissions += 1;
console.log(totalSubmissions); // 1
\`\`\`

#### 3. Temporal Dead Zone (TDZ)

Variables declared with \`let\` and \`const\` are hoisted to the top of their block, but they cannot be accessed before their declaration line. Accessing them prematurely results in a \`ReferenceError\`.
`,
      learningObjectives: [
        'Differentiate between let, const, and var',
        'Understand block scope vs function scope',
        'Recognize the Temporal Dead Zone (TDZ)',
      ],
    });

    // Exercise attached to Lesson 1: Quiz Knowledge Check
    await adminService.createExercise(l1.id, {
      title: 'Knowledge Check: Variables & Scope',
      type: 'quiz',
      marks: 10,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'q1',
            question: 'What happens when you reassign a variable declared with const?',
            options: [
              'It silently changes the value',
              'It throws a TypeError: Assignment to constant variable',
              'It creates a new variable in the global scope',
              'It converts the variable to let',
            ],
            correctAnswer: 1,
            explanation: 'const creates an immutable binding. Reassigning it causes the JavaScript runtime to throw a TypeError.',
          },
          {
            id: 'q2',
            question: 'Which of the following creates block-scoped variables in modern JavaScript?',
            options: [
              'var and function',
              'let and const',
              'def and let',
              'global and local',
            ],
            correctAnswer: 1,
            explanation: 'let and const are block-scoped ({ ... }), whereas var is function-scoped.',
          },
        ],
      },
    });

    // Lesson 2: Coding Exercise
    const l2 = await adminService.createLesson(mod1.id, {
      title: 'Practice: Sum of Array Elements',
      slug: 'sum-of-array-elements',
      order: 2,
      type: 'coding',
      content: `### Practice Exercise: Calculate Array Sum

In this practice task, you will implement a function that calculates the total sum of an array of numbers using modern array iteration or reduce.

#### Example:
- Input: \`[1, 2, 3, 4, 5]\`
- Output: \`15\`
`,
      learningObjectives: ['Implement array accumulator logic', 'Write clean ES6 syntax'],
    });

    await adminService.createExercise(l2.id, {
      title: 'Array Sum Function',
      type: 'coding',
      marks: 25,
      isMandatory: true,
      order: 1,
      starterCode: {
        javascript: `function sumArray(nums) {\n  // Write your code here\n  return nums.reduce((a, b) => a + b, 0);\n}\n\nconsole.log(sumArray([1, 2, 3, 4, 5]));\n`,
      },
      hints: ['You can use the Array.prototype.reduce method or a standard for...of loop.'],
    });
  } catch (err) {
    console.log(`Course 1 setup note: ${err.message}`);
  }

  // 4. Seed Learning Path: JavaScript Mastery
  try {
    const path = await adminService.createPath({
      title: 'JavaScript for Beginners to Pro',
      slug: 'javascript-mastery',
      description: 'Build robust, production-ready frontend and backend applications with modern JavaScript and ECMAScript standards.',
      difficulty: 'beginner',
      estimatedHours: 12,
      tags: ['JavaScript', 'ES6', 'Web Development', 'Foundations'],
      status: 'published',
      courseIds: course1 ? [course1.id] : [],
    });
    console.log(`Learning Path seeded and published: ${path?.title}`);
  } catch (err) {
    console.log(`Path setup note: ${err.message}`);
  }

  // 5. Seed Learning Path: Data Structures & Algorithms
  try {
    const dsaCourse = await adminService.createCourse({
      title: 'Arrays, Strings & Two-Pointer Techniques',
      slug: 'arrays-and-two-pointers',
      description: 'Master in-place manipulation, sliding windows, two pointers, and prefix sums.',
      difficulty: 'intermediate',
      estimatedMinutes: 90,
      status: 'published',
    });

    const dsaMod = await adminService.createModule(dsaCourse.id, {
      title: 'Module 1: Two-Pointer & In-Place Arrays',
      description: 'Techniques for solving array problems with O(1) auxiliary space.',
      order: 1,
    });

    const dsaLesson = await adminService.createLesson(dsaMod.id, {
      title: 'Two-Pointer Technique Essentials',
      slug: 'two-pointer-technique',
      order: 1,
      type: 'reading',
      content: `### Two-Pointer Technique

The two-pointer technique uses two indices to traverse a data structure (typically a sorted array or string) towards each other or in the same direction.

#### Key Use Cases:
1. **Opposite Ends**: Pair with Target Sum, Palindrome verification, Inverting arrays.
2. **Fast & Slow**: Cycle detection, removing duplicates in-place.

\`\`\`javascript
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }
  return true;
}
\`\`\`
`,
      learningObjectives: [
        'Recognize when to apply two-pointer traversal',
        'Analyze O(N) time and O(1) space efficiency',
      ],
    });

    await adminService.createExercise(dsaLesson.id, {
      title: 'Knowledge Check: Two Pointers',
      type: 'quiz',
      marks: 10,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'q1',
            question: 'What is the auxiliary space complexity of the standard two-pointer array traversal?',
            options: ['O(N)', 'O(1)', 'O(log N)', 'O(N^2)'],
            correctAnswer: 1,
            explanation: 'Two pointers only maintain two index pointers in memory, requiring O(1) constant auxiliary space.',
          },
        ],
      },
    });

    await adminService.createPath({
      title: 'Data Structures & Algorithms in Practice',
      slug: 'dsa-mastery',
      description: 'Comprehensive study plan covering Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, and Dynamic Programming.',
      difficulty: 'intermediate',
      estimatedHours: 24,
      tags: ['DSA', 'Algorithms', 'Problem Solving', 'Data Structures'],
      status: 'published',
      courseIds: [dsaCourse.id],
    });
    console.log('DSA Mastery path seeded.');
  } catch (err) {
    console.log(`DSA Path setup note: ${err.message}`);
  }

  await app.close();
  console.log('Starter curriculum seeding completed successfully!');
  process.exit(0);
}

bootstrap();
