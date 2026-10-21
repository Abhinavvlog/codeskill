import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminLearningService } from '../learning/services/admin-learning.service';

async function bootstrap() {
  console.log('🚀 Seeding CodeSkill Rich Learning Platform Curriculum & Dummy Data...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminLearningService);

  // ==========================================
  // 1. BADGES (Gamification Rewards)
  // ==========================================
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
      code: 'AI_PIONEER',
      name: 'AI Pioneer',
      description: 'Completed the Foundations of Large Language Models course.',
      iconUrl: '/images/badges/ai-pioneer.svg',
      rarity: 'rare' as const,
      category: 'skills' as const,
      criteria: { type: 'course_completed', slug: 'ai-foundations-llm' },
    },
    {
      code: 'PROMPT_WIZARD',
      name: 'Prompt Wizard',
      description: 'Mastered Advanced Prompt Engineering, Few-Shot, and Chain-of-Thought reasoning.',
      iconUrl: '/images/badges/prompt-wizard.svg',
      rarity: 'epic' as const,
      category: 'mastery' as const,
      criteria: { type: 'course_completed', slug: 'advanced-prompt-engineering' },
    },
    {
      code: 'PYTHON_MASTER',
      name: 'Python Master',
      description: 'Mastered Python from fundamentals through OOP, decorators, and memory-efficient generators.',
      iconUrl: '/images/badges/python-master.svg',
      rarity: 'epic' as const,
      category: 'skills' as const,
      criteria: { type: 'path_completed', slug: 'python-complete-mastery' },
    },
    {
      code: 'JS_NINJA',
      name: 'JavaScript Ninja',
      description: 'Conquered JavaScript closures, the V8 event loop, and asynchronous concurrency.',
      iconUrl: '/images/badges/js-ninja.svg',
      rarity: 'epic' as const,
      category: 'skills' as const,
      criteria: { type: 'path_completed', slug: 'javascript-mastery' },
    },
    {
      code: 'PATH_CHAMPION',
      name: 'Path Champion',
      description: 'Completed an entire learning path curriculum and received a verified credential.',
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
      criteria: { type: 'path_completed', slug: 'dsa-mastery' },
    },
  ];

  for (const b of badges) {
    try {
      await adminService.createBadge(b);
      console.log(`✓ Badge seeded: ${b.name}`);
    } catch {
      // Ignored if exists
    }
  }

  // ==========================================
  // 2. CERTIFICATE TEMPLATE
  // ==========================================
  try {
    await adminService.createCertificateTemplate({
      name: 'CodeSkill Verified Professional Credential',
      title: 'Certificate of Verified Technical Mastery',
      issuerName: 'Technical Training & Development Board',
      issuerTitle: 'Head of Technical Training & Development',
      issuerOrganization: 'CodeSkill · Chandigarh University',
      isDefault: true,
    });
    console.log('✓ Certificate template seeded.');
  } catch {
    // Ignored if exists
  }

  // ==========================================
  // 3. AI & PROMPT ENGINEERING PATH
  // ==========================================
  console.log('\n--- Seeding AI & Prompt Engineering Path ---');
  let aiCourse1, aiCourse2;
  try {
    aiCourse1 = await adminService.createCourse({
      title: 'Foundations of Large Language Models & Generative AI',
      slug: 'ai-foundations-llm',
      description: 'Understand how LLMs work under the hood: BPE tokenization, context windows, attention mechanisms, and sampling parameters.',
      difficulty: 'beginner',
      estimatedMinutes: 60,
      status: 'published',
    });

    const aiMod1 = await adminService.createModule(aiCourse1.id, {
      title: 'Module 1: How LLMs Process Text',
      description: 'Tokens, Context Windows, and Temperature / Top-P sampling parameters.',
      order: 1,
    });

    // Lesson 1: Tokens and Parameters
    const aiL1 = await adminService.createLesson(aiMod1.id, {
      title: 'Tokens, Context Windows & Sampling Controls',
      slug: 'tokens-context-windows-sampling',
      order: 1,
      type: 'reading',
      content: `### How Large Language Models Process Information

Large Language Models (LLMs) such as GPT-4, Claude, and Gemini do not read raw strings or words directly. Instead, they operate on mathematical units called **Tokens**.

#### 1. What is a Token?
- In the English language, **1 token is roughly 4 characters or 0.75 words**.
- Common words (e.g., \`the\`, \`apple\`, \`function\`) are typically 1 single token.
- Rare words, code syntax, spaces, and punctuation may be split into multiple sub-word tokens using algorithms such as Byte-Pair Encoding (BPE).
- Example: The word \`unbelievable\` may be tokenized into \`["un", "believ", "able"]\`.

#### 2. The Context Window
The **Context Window** is the maximum total number of tokens (both input prompt + output generation) that a model can process in a single forward pass:
- If your conversation exceeds the context window, earlier tokens are truncated or dropped.
- Modern models offer windows from 8k up to 1M+ tokens, but larger contexts can suffer from the *"Lost in the Middle"* phenomenon where information in the middle of long prompts receives lower attention weight.

#### 3. Generation Hyperparameters

When interacting with an LLM API, you control creativity vs determinism using sampling parameters:

| Parameter | Range | Purpose | Recommended Setting |
| :--- | :--- | :--- | :--- |
| **Temperature** | 0.0 - 2.0 | Controls randomness in next-token selection. Lower values make output deterministic; higher values make it diverse. | **0.0 - 0.2** for Code & Math; **0.7 - 0.9** for Creative Writing |
| **Top-P (Nucleus Sampling)** | 0.0 - 1.0 | Dynamically selects tokens from the top cumulative probability mass. | **0.9 - 0.95** (alternative to temperature) |
| **Frequency Penalty** | -2.0 - 2.0 | Discourages the model from repeating the exact same words or phrases. | **0.0 - 0.5** to avoid repetitive loops |

> **Pro Tip**: To get reproducible, reliable JSON or code from an LLM, always set **\`temperature: 0.0\`** and specify an exact output schema.
`,
      learningObjectives: [
        'Understand the relationship between characters, words, and tokens',
        'Analyze context window limits and truncation risks',
        'Configure temperature and top_p for deterministic code and analysis tasks',
      ],
    });

    await adminService.createExercise(aiL1.id, {
      title: 'Knowledge Check: LLM Tokens & Hyperparameters',
      type: 'quiz',
      marks: 15,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'ai-q1',
            question: 'If you need an LLM to generate strictly valid JSON schema data for an API integration, which temperature setting is recommended?',
            options: [
              'temperature: 1.5 (maximizes creative formatting)',
              'temperature: 0.0 (maximizes determinism and adherence to schema)',
              'temperature: 2.0 (ensures all tokens have equal probability)',
              'temperature: -1.0 (reverses token probabilities)',
            ],
            correctAnswer: 1,
            explanation: 'A temperature of 0.0 selects the argmax (highest probability) token at every step, producing deterministic and consistent structured output.',
          },
          {
            id: 'ai-q2',
            question: 'Roughly how many English words does a 1,000-token prompt contain?',
            options: [
              'Approximately 250 words',
              'Approximately 750 words',
              'Approximately 2,000 words',
              'Exactly 1,000 words',
            ],
            correctAnswer: 1,
            explanation: 'On average, 1 token is approximately 0.75 words in English. Therefore, 1,000 tokens ≈ 750 words.',
          },
          {
            id: 'ai-q3',
            question: 'What happens when an LLM conversation exceeds its context window?',
            options: [
              'The model crashes and deletes user data',
              'The model charges double the API rate',
              'Older tokens are truncated, causing the model to forget earlier conversation context',
              'The model automatically increases its parameter size',
            ],
            correctAnswer: 2,
            explanation: 'Context windows are fixed-size attention buffers. Exceeding tokens necessitates truncation or sliding window summaries, losing earlier context.',
          },
        ],
      },
    });

    // Lesson 2: In-Context Learning (Zero-Shot & Few-Shot)
    const aiL2 = await adminService.createLesson(aiMod1.id, {
      title: 'In-Context Learning: Zero-Shot vs Few-Shot Prompting',
      slug: 'zero-shot-vs-few-shot-prompting',
      order: 2,
      type: 'reading',
      content: `### Mastering In-Context Learning

**In-Context Learning (ICL)** is the ability of LLMs to understand tasks and adopt specific formats simply by seeing examples in the prompt, **without any fine-tuning or model weight updates**.

#### 1. Zero-Shot Prompting
In Zero-Shot prompting, you provide only the task instruction without any prior demonstration examples:

\`\`\`markdown
Classify the sentiment of the following customer review as POSITIVE, NEGATIVE, or NEUTRAL.

Review: "The package arrived 2 days earlier than scheduled and in pristine condition!"
Sentiment:
\`\`\`

- **When to use**: Straightforward tasks, standard summaries, translation, and common classification.

#### 2. Few-Shot Prompting
In Few-Shot prompting, you provide 2 to 5 exemplar pairs \`(Input, Output)\` that demonstrate the target reasoning pattern and output format:

\`\`\`markdown
Classify customer inquiries and extract the intent and urgency level in JSON format.

Inquiry: "My server crashed and production is down for all customers!"
Output: {"intent": "system_outage", "urgency": "critical", "route_to": "tier_3_devops"}

Inquiry: "Can you tell me if your pricing plan includes automated PDF invoices?"
Output: {"intent": "billing_inquiry", "urgency": "low", "route_to": "sales"}

Inquiry: "I cannot log in with my university email since this morning."
Output:
\`\`\`

#### Benefits of Few-Shot Demonstrations:
1. **Guaranteed Output Consistency**: The model mirrors the exact JSON structure of the examples.
2. **Domain Adaptation**: Teaches custom categorization or university-specific abbreviations instantly.
3. **Reduces Edge-Case Failures**: Providing an example of an ambiguous input guides the model on how to handle corner cases.
`,
      learningObjectives: [
        'Differentiate between zero-shot and few-shot prompt architectures',
        'Construct effective demonstration pairs to enforce strict schema outputs',
        'Select the appropriate prompting technique based on task complexity',
      ],
    });

    await adminService.createExercise(aiL2.id, {
      title: 'Prompt Engineering Exercise: Sentiment & Entity Extractor',
      type: 'quiz',
      marks: 15,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'ai-q4',
            question: 'Why is Few-Shot prompting superior to Zero-Shot when requesting custom structured JSON output?',
            options: [
              'Because Few-Shot permanently modifies the neural network weights on the server',
              'Because demonstration examples provide visual and structural templates that the attention mechanism mirrors directly',
              'Because Few-Shot uses fewer tokens than Zero-Shot',
              'Because Zero-Shot models cannot output JSON under any circumstances',
            ],
            correctAnswer: 1,
            explanation: 'The attention mechanism conditions next-token probabilities on the provided examples, faithfully reproducing the demonstrated schema.',
          },
        ],
      },
    });

    console.log(`✓ Course seeded: ${aiCourse1.title}`);
  } catch (err: any) {
    console.log(`AI Course 1 setup: ${err.message}`);
  }

  // Course 2: Advanced Prompt Engineering
  try {
    aiCourse2 = await adminService.createCourse({
      title: 'Advanced Prompt Engineering & Cognitive Patterns',
      slug: 'advanced-prompt-engineering',
      description: 'Master Chain-of-Thought (CoT), ReAct tool-calling frameworks, hallucination mitigation, and secure prompt architectures.',
      difficulty: 'intermediate',
      estimatedMinutes: 90,
      status: 'published',
    });

    const aiMod2 = await adminService.createModule(aiCourse2.id, {
      title: 'Module 1: Chain of Thought & Reasoning Frameworks',
      description: 'Cognitive decomposition, structured delimiters, and hallucination reduction.',
      order: 1,
    });

    const aiAdvL1 = await adminService.createLesson(aiMod2.id, {
      title: 'Chain-of-Thought (CoT) & Reasoning Architectures',
      slug: 'chain-of-thought-reasoning',
      order: 1,
      type: 'reading',
      content: `### Chain-of-Thought (CoT) Prompting

Standard LLM generation attempts to output the answer immediately in a single step. For multi-step arithmetic, logic puzzles, or system architecture tasks, this often leads to errors.

**Chain-of-Thought (CoT)** forces the model to break down complex problems into explicit intermediate calculation steps before providing the final conclusion.

#### 1. Zero-Shot CoT: The Magic Phrase
Adding the directive **\`"Let's think step by step:"\`** causes the model to generate its intermediate chain of reasoning, dramatically increasing accuracy on mathematical and algorithmic problems.

\`\`\`markdown
Problem: A student takes 3 coding exams. Exam 1 has 20 questions, Exam 2 has 30% more questions than Exam 1, and Exam 3 has 5 fewer questions than Exam 2. How many total questions did the student face?

Let's think step by step:
1. Exam 1 = 20 questions.
2. 30% of 20 = 0.3 * 20 = 6 questions. So Exam 2 = 20 + 6 = 26 questions.
3. Exam 3 = Exam 2 - 5 = 26 - 5 = 21 questions.
4. Total questions = Exam 1 + Exam 2 + Exam 3 = 20 + 26 + 21 = 67 questions.

Therefore, the student faced 67 total questions.
\`\`\`

#### 2. Delimiters and Prompt Structuring
To prevent prompt injections and clearly delineate instructions from user input, always use clear delimiters:

\`\`\`markdown
### ROLE & OBJECTIVE ###
You are a Principal Software Architect conducting code reviews for university submissions.

### CONSTRAINTS ###
- Analyze time and space complexity in Big-O notation.
- If the submission contains an infinite loop or memory leak, flag it as CRITICAL.
- Respond in valid markdown format.

### USER CODE SUBMISSION ###
\`\`\`javascript
function findDuplicates(arr) {
  let seen = new Set();
  return arr.filter(item => seen.has(item) ? true : (seen.add(item), false));
}
\`\`\`

### ANALYSIS & REVIEW ###
\`\`\`
`,
      learningObjectives: [
        'Apply Chain-of-Thought prompting to multi-step logic and mathematical tasks',
        'Use explicit delimiters (###, XML tags, or backticks) to separate instructions from untrusted input',
        'Prevent hallucinations by grounding prompts in verifiable context',
      ],
    });

    await adminService.createExercise(aiAdvL1.id, {
      title: 'Knowledge Check: Chain-of-Thought & Prompt Architecture',
      type: 'quiz',
      marks: 20,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'cot-q1',
            question: 'Why does Chain-of-Thought (CoT) prompting increase accuracy on multi-step reasoning problems?',
            options: [
              'It gives the model more computational time/tokens to develop intermediate states before generating the final answer',
              'It permanently enables GPU multi-threading on the server',
              'It bypasses the tokenizer directly',
              'It increases the context window size automatically',
            ],
            correctAnswer: 0,
            explanation: 'Each generated token becomes part of the prompt context for subsequent tokens. Generating reasoning steps explicitly allows subsequent tokens to attend to verified intermediate calculations.',
          },
          {
            id: 'cot-q2',
            question: 'Which of the following is the most secure method to prevent prompt injection when accepting untrusted user inputs?',
            options: [
              'Wrap user inputs with explicit delimiters (e.g., XML tags like <user_input>...</user_input> or ###) and instruct the system to treat content inside as data only',
              'Increase the temperature to 2.0',
              'Delete all consonants from the user prompt',
              'Only run prompts on weekdays',
            ],
            correctAnswer: 0,
            explanation: 'Structured delimiters establish a clear semantic boundary between instructions and raw data, preventing the LLM from executing user-provided commands.',
          },
        ],
      },
    });

    console.log(`✓ Course seeded: ${aiCourse2.title}`);
  } catch (err: any) {
    console.log(`AI Course 2 setup: ${err.message}`);
  }

  // Create AI Path
  try {
    const aiPath = await adminService.createPath({
      title: 'Artificial Intelligence & Prompt Engineering Masterclass',
      slug: 'ai-prompt-engineering',
      description: 'Master Generative AI, LLM tokenomics, zero/few-shot in-context learning, Chain-of-Thought reasoning, and hallucination guardrails.',
      difficulty: 'beginner',
      estimatedHours: 10,
      tags: ['AI', 'Prompt Engineering', 'LLM', 'Generative AI', 'NLP'],
      iconUrl: '/images/tech/ai-brain.svg',
      status: 'published',
      courseIds: [aiCourse1?.id, aiCourse2?.id].filter((id): id is string => typeof id === 'string'),
    });
    console.log(`✓ Learning Path published: ${aiPath?.title}`);
  } catch (err: any) {
    console.log(`AI Path setup note: ${err.message}`);
  }

  // ==========================================
  // 4. PYTHON COMPLETE: BASICS TO ADVANCED
  // ==========================================
  console.log('\n--- Seeding Python Basics to Advanced Path ---');
  let pyCourse1, pyCourse2;

  try {
    pyCourse1 = await adminService.createCourse({
      title: 'Python Core Fundamentals & Data Structures',
      slug: 'python-core-fundamentals',
      description: 'Master Pythonic syntax, primitive types, mutability vs immutability, list comprehensions, and dictionaries.',
      difficulty: 'beginner',
      estimatedMinutes: 75,
      status: 'published',
    });

    const pyMod1 = await adminService.createModule(pyCourse1.id, {
      title: 'Module 1: Variables, Mutability & Comprehensions',
      description: 'Understanding Python memory models, references, and list comprehensions.',
      order: 1,
    });

    // Lesson 1: Mutability
    const pyL1 = await adminService.createLesson(pyMod1.id, {
      title: 'Python Memory Model: Mutable vs Immutable Objects',
      slug: 'python-mutability-references',
      order: 1,
      type: 'reading',
      content: `### Understanding Object Mutability in Python

In Python, everything is an **object**. Every object has an **identity (id)**, a **type**, and a **value**.

#### 1. Immutable Objects
An object whose internal state cannot be modified after creation is **immutable**.
- **Examples**: \`int\`, \`float\`, \`bool\`, \`str\`, \`tuple\`, \`frozenset\`.
- When you perform operations like concatenating strings or adding numbers, Python creates a brand-new object in memory.

\`\`\`python
a = (1, 2, 3)
# a[0] = 99  # TypeError: 'tuple' object does not support item assignment

s = "CodeSkill"
s += " University" # Creates a new string object in memory; original 'CodeSkill' is untouched
\`\`\`

#### 2. Mutable Objects
An object whose internal state can be changed in-place without altering its memory identity (\`id()\`) is **mutable**.
- **Examples**: \`list\`, \`dict\`, \`set\`, custom user classes.

\`\`\`python
nums1 = [10, 20, 30]
nums2 = nums1  # nums2 points to the SAME list in memory!

nums2.append(40)
print(nums1)  # [10, 20, 30, 40] - Modifying nums2 modified nums1!
print(nums1 is nums2)  # True (Identical memory address)
\`\`\`

> **Crucial Gotcha: Mutable Default Arguments**
> Never use a mutable object as a default argument in a function signature:
> \`def append_to(val, target=[]):\` # BUG: \`target\` is evaluated once at module load time!
> Always use \`target=None\` and initialize inside: \`target = target if target is not None else []\`.
`,
      learningObjectives: [
        'Differentiate between mutable and immutable Python data structures',
        'Analyze object references, shallow copies, and deep copies',
        'Avoid the classic mutable default argument pitfall',
      ],
    });

    await adminService.createExercise(pyL1.id, {
      title: 'Knowledge Check: Python References & Mutability',
      type: 'quiz',
      marks: 10,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'py-q1',
            question: 'Which of the following data types in Python is IMMUTABLE?',
            options: ['list', 'dict', 'set', 'tuple'],
            correctAnswer: 3,
            explanation: 'Tuples are immutable sequences. Once created, their items cannot be modified, added, or removed.',
          },
          {
            id: 'py-q2',
            question: 'What is the output of the following code: `a = [1]; b = a; b.append(2); print(len(a))`?',
            options: ['1', '2', 'Error', 'None'],
            correctAnswer: 1,
            explanation: 'b and a reference the same list in memory. Mutating b directly affects a, so len(a) is 2.',
          },
        ],
      },
    });

    // Lesson 2: List Comprehensions (Coding Exercise)
    const pyL2 = await adminService.createLesson(pyMod1.id, {
      title: 'List Comprehensions & Functional Filters',
      slug: 'python-list-comprehensions',
      order: 2,
      type: 'coding',
      content: `### Pythonic List Comprehensions

List comprehensions provide a concise, readable, and computationally fast syntax for transforming and filtering iterables.

#### General Syntax:
\`\`\`python
[expression for item in iterable if condition]
\`\`\`

#### Comparison with Standard Loops:
Instead of writing 5 lines of boilerplate:
\`\`\`python
# Imperative approach
evens = []
for x in range(10):
    if x % 2 == 0:
        evens.append(x ** 2)

# Pythonic Comprehension
evens = [x ** 2 for x in range(10) if x % 2 == 0]
\`\`\`

List comprehensions run in optimized C-level bytecode in CPython, outperforming standard \`.append()\` loops.
`,
      learningObjectives: [
        'Write expressive list and dictionary comprehensions',
        'Apply conditional filters to transform collections in O(N) time',
      ],
    });

    await adminService.createExercise(pyL2.id, {
      title: 'Practice: Square Even Numbers',
      type: 'coding',
      marks: 25,
      isMandatory: true,
      order: 1,
      starterCode: {
        python: `def square_evens(nums):\n    """\n    Return a new list containing squares of all even numbers from nums.\n    """\n    return [x ** 2 for x in nums if x % 2 == 0]\n\nprint(square_evens([1, 2, 3, 4, 5, 6]))\n`,
      },
      hints: ['Use [x ** 2 for x in nums if x % 2 == 0] to filter and square in one step.'],
    });

    console.log(`✓ Course seeded: ${pyCourse1.title}`);
  } catch (err: any) {
    console.log(`Python Course 1 setup: ${err.message}`);
  }

  // Python Course 2: Advanced Python (Decorators & Generators)
  try {
    pyCourse2 = await adminService.createCourse({
      title: 'Advanced Python: OOP, Decorators & Memory Generators',
      slug: 'python-advanced-oop-decorators',
      description: 'Master first-class functions, higher-order closures, Python decorators, and memory-efficient streaming with generators.',
      difficulty: 'advanced',
      estimatedMinutes: 90,
      status: 'published',
    });

    const pyMod2 = await adminService.createModule(pyCourse2.id, {
      title: 'Module 1: Metaprogramming & Streaming Iteration',
      description: 'Function wrappers, preservation of metadata with functools.wraps, and generator pipelines.',
      order: 1,
    });

    const pyAdvL1 = await adminService.createLesson(pyMod2.id, {
      title: 'Decorators and Higher-Order Closures',
      slug: 'python-decorators-closures',
      order: 1,
      type: 'reading',
      content: `### Mastering Python Decorators

A **Decorator** is a callable that takes a function as input, extends or modifies its behavior without directly changing its source code, and returns a new callable.

#### 1. First-Class Functions
In Python, functions are first-class citizens: they can be passed as arguments, assigned to variables, and returned from other functions.

#### 2. The Decorator Pattern & \`functools.wraps\`
\`\`\`python
import time
from functools import wraps

def time_execution(func):
    @wraps(func)  # Preserves func.__name__ and docstrings
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"[{func.__name__}] executed in {duration:.4f}s")
        return result
    return wrapper

@time_execution
def process_submissions(count):
    """Processes online judge student submissions."""
    return sum(i for i in range(count))

process_submissions(1_000_000)
print(process_submissions.__name__)  # 'process_submissions' (not 'wrapper')
\`\`\`

#### Key Benefits of Decorators:
1. **Separation of Concerns**: Decouples cross-cutting concerns (authentication, rate limiting, logging, performance metrics) from business logic.
2. **DRY Principle**: Reuse validation across dozens of API endpoints with a single line: \`@require_admin\`.
`,
      learningObjectives: [
        'Construct function and method decorators using *args and **kwargs',
        'Preserve function introspection metadata with functools.wraps',
        'Implement production-ready execution timing and caching wrappers',
      ],
    });

    await adminService.createExercise(pyAdvL1.id, {
      title: 'Knowledge Check: Decorator Flow & Wrappers',
      type: 'quiz',
      marks: 15,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'dec-q1',
            question: 'Why is @functools.wraps(func) essential when building custom decorators?',
            options: [
              'It compiles the function into C code for speed',
              'It copies over original function metadata like __name__, __doc__, and annotations to the wrapper',
              'It automatically handles SQL injection vulnerabilities',
              'It forces the function to run synchronously',
            ],
            correctAnswer: 1,
            explanation: '@functools.wraps copies the original function attributes (name, docstring, annotations) to the wrapper, preventing loss of introspection.',
          },
        ],
      },
    });

    // Lesson 2: Generators
    const pyAdvL2 = await adminService.createLesson(pyMod2.id, {
      title: 'Generators & Memory-Efficient Streaming with yield',
      slug: 'python-generators-yield',
      order: 2,
      type: 'coding',
      content: `### Generators: Streaming Millions of Rows with O(1) Memory

Standard functions compute their entire return value and store it in RAM simultaneously. If you are reading a 50GB server log or generating 10 million Fibonacci numbers, this will trigger an Out-Of-Memory (OOM) crash.

**Generators** use the **\`yield\`** keyword to produce items lazily on demand, pausing execution state between calls and keeping memory overhead at constant **O(1)**.

#### Generator Example:
\`\`\`python
def fibonacci_stream(limit):
    a, b = 0, 1
    count = 0
    while count < limit:
        yield a
        a, b = b, a + b
        count += 1

# Generates values one at a time on demand:
for num in fibonacci_stream(6):
    print(num, end=" ")  # 0 1 1 2 3 5
\`\`\`
`,
      learningObjectives: [
        'Understand the Python iterator protocol (__iter__ and __next__)',
        'Implement memory-efficient data pipelines using the yield keyword',
      ],
    });

    await adminService.createExercise(pyAdvL2.id, {
      title: 'Practice: Custom Fibonacci Generator',
      type: 'coding',
      marks: 25,
      isMandatory: true,
      order: 1,
      starterCode: {
        python: `def fibonacci_list(n):\n    """\n    Generate the first n numbers of the Fibonacci sequence as a list.\n    """\n    def fib_gen(limit):\n        a, b = 0, 1\n        for _ in range(limit):\n            yield a\n            a, b = b, a + b\n    return list(fib_gen(n))\n\nprint(fibonacci_list(7))\n`,
      },
      hints: ['Use yield a inside a while or for loop, then advance with a, b = b, a + b.'],
    });

    console.log(`✓ Course seeded: ${pyCourse2.title}`);
  } catch (err: any) {
    console.log(`Python Course 2 setup: ${err.message}`);
  }

  // Create Python Path
  try {
    const pyPath = await adminService.createPath({
      title: 'Python Complete: From Zero to Advanced Architecture',
      slug: 'python-complete-mastery',
      description: 'Master Python from fundamentals to advanced enterprise engineering: memory models, list comprehensions, OOP, decorators, and memory-efficient generators.',
      difficulty: 'intermediate',
      estimatedHours: 16,
      tags: ['Python', 'Backend', 'Data Structures', 'OOP', 'Advanced'],
      iconUrl: '/images/tech/python.svg',
      status: 'published',
      courseIds: [pyCourse1?.id, pyCourse2?.id].filter((id): id is string => typeof id === 'string'),
    });
    console.log(`✓ Learning Path published: ${pyPath?.title}`);
  } catch (err: any) {
    console.log(`Python Path setup note: ${err.message}`);
  }

  // ==========================================
  // 5. JAVASCRIPT: FOUNDATIONS TO ASYNC
  // ==========================================
  console.log('\n--- Seeding JavaScript Foundations to Advanced Path ---');
  let jsCourse1, jsCourse2;

  try {
    jsCourse1 = await adminService.createCourse({
      title: 'JavaScript Foundations & ES6+ Scoping',
      slug: 'javascript-foundations',
      description: 'Master modern ECMAScript, let vs const, Temporal Dead Zone, lexical scoping, closures, and arrow functions.',
      difficulty: 'beginner',
      estimatedMinutes: 60,
      status: 'published',
    });

    const jsMod1 = await adminService.createModule(jsCourse1.id, {
      title: 'Module 1: Variables, Scope & Closures',
      description: 'Block scoping, the TDZ, and lexical closures.',
      order: 1,
    });

    const jsL1 = await adminService.createLesson(jsMod1.id, {
      title: 'Scope, Hoisting & The Temporal Dead Zone (TDZ)',
      slug: 'scope-hoisting-temporal-dead-zone',
      order: 1,
      type: 'reading',
      content: `### Scoping & Hoisting in Modern JavaScript

JavaScript executes in two phases: **Creation Phase** (memory allocation/hoisting) and **Execution Phase** (line-by-line interpretation).

#### 1. \`var\` vs \`let\` / \`const\`
- **\`var\`**: Function-scoped or globally-scoped. Hoisted and initialized with \`undefined\`.
- **\`let\` and \`const\`**: Block-scoped (enclosed within curly braces \`{ ... }\`). Hoisted to the top of the block, but **NOT** initialized.

#### 2. The Temporal Dead Zone (TDZ)
The **Temporal Dead Zone** is the period between entering a scope and the actual line where the variable is declared:
\`\`\`javascript
{
  // TDZ begins here for 'student'
  // console.log(student); // ReferenceError: Cannot access 'student' before initialization
  
  let student = "Aarav Sharma"; // TDZ ends here
  console.log(student); // "Aarav Sharma"
}
\`\`\`

#### 3. Closures
A **closure** is a function bundled together with references to its surrounding lexical environment:
\`\`\`javascript
function createCounter(initialValue = 0) {
  let count = initialValue; // Private variable encapsulated by closure
  return {
    increment() { count += 1; return count; },
    get() { return count; }
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.get());       // 11
\`\`\`
`,
      learningObjectives: [
        'Differentiate between block scope, function scope, and global scope',
        'Diagnose and prevent Temporal Dead Zone ReferenceErrors',
        'Implement encapsulated private state using JavaScript closures',
      ],
    });

    await adminService.createExercise(jsL1.id, {
      title: 'Knowledge Check: JS Scoping & Closures',
      type: 'quiz',
      marks: 15,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'js-q1',
            question: 'What happens if you attempt to access a `let` variable before its line of declaration?',
            options: [
              'It returns undefined',
              'It throws a ReferenceError due to the Temporal Dead Zone (TDZ)',
              'It defaults to null',
              'It returns NaN',
            ],
            correctAnswer: 1,
            explanation: 'Variables declared with let/const are in the TDZ from the start of the block until declaration, throwing a ReferenceError if accessed prematurely.',
          },
          {
            id: 'js-q2',
            question: 'What is a closure in JavaScript?',
            options: [
              'A syntax error that closes the browser window',
              'A function that retains access to variables from its outer lexical scope even after the outer function has finished executing',
              'A method to encrypt passwords in localStorage',
              'A CSS property for closing modal popups',
            ],
            correctAnswer: 1,
            explanation: 'A closure is formed when an inner function remembers and has access to its lexical scope even when invoked outside that scope.',
          },
        ],
      },
    });

    console.log(`✓ Course seeded: ${jsCourse1.title}`);
  } catch (err: any) {
    console.log(`JS Course 1 setup: ${err.message}`);
  }

  // Course 2: Advanced JavaScript (Async & Event Loop)
  try {
    jsCourse2 = await adminService.createCourse({
      title: 'Advanced JavaScript: The Event Loop & Async Architecture',
      slug: 'javascript-advanced-async-event-loop',
      description: 'Master the V8 Call Stack, Macrotasks vs Microtasks, Promises, and non-blocking asynchronous architectures.',
      difficulty: 'advanced',
      estimatedMinutes: 90,
      status: 'published',
    });

    const jsMod2 = await adminService.createModule(jsCourse2.id, {
      title: 'Module 1: Concurrency Model & Asynchronous Execution',
      description: 'Call stack, microtask queue, macrotask queue, and Promise combinators.',
      order: 1,
    });

    const jsAdvL1 = await adminService.createLesson(jsMod2.id, {
      title: 'The Event Loop: Microtasks vs Macrotasks',
      slug: 'javascript-event-loop-microtasks',
      order: 1,
      type: 'reading',
      content: `### The JavaScript Concurrency Model & Event Loop

JavaScript is **single-threaded**: it has one Call Stack and executes one command at a time. Concurrency is handled by the browser/Node.js runtime via the **Event Loop**.

#### Execution Priority Order:
1. **Call Stack**: Executes synchronous code line-by-line until empty.
2. **Microtask Queue**: Executed IMMEDIATELY after the call stack empties and before rendering or macrotasks.
   - Includes: \`Promise.then()\`, \`Promise.catch()\`, \`queueMicrotask()\`, \`process.nextTick()\` (Node.js).
3. **Macrotask (Task) Queue**: Executed one task at a time after the microtask queue has completely drained.
   - Includes: \`setTimeout()\`, \`setInterval()\`, I/O, UI event handlers.

#### Predict the Output:
\`\`\`javascript
console.log("1 - Sync Start");

setTimeout(() => {
  console.log("2 - Timeout (Macrotask)");
}, 0);

Promise.resolve().then(() => {
  console.log("3 - Promise (Microtask)");
});

console.log("4 - Sync End");

// Output Order:
// 1 - Sync Start
// 4 - Sync End
// 3 - Promise (Microtask)
// 2 - Timeout (Macrotask)
\`\`\`

> **Rule of Thumb**: All microtasks are exhausted before the event loop picks up the next macrotask!
`,
      learningObjectives: [
        'Diagram the interplay between Call Stack, Microtask Queue, and Macrotask Queue',
        'Predict exact console log sequences involving synchronous code, timeouts, and promises',
        'Prevent UI freezes by avoiding microtask starvation loops',
      ],
    });

    await adminService.createExercise(jsAdvL1.id, {
      title: 'Knowledge Check: Event Loop Execution Order',
      type: 'quiz',
      marks: 20,
      isMandatory: true,
      order: 1,
      quizConfig: {
        questions: [
          {
            id: 'ev-q1',
            question: 'Between a pending Promise.then() callback and a setTimeout(..., 0) callback, which one will execute first once the Call Stack is empty?',
            options: [
              'setTimeout callback because it was queued in timers',
              'Promise.then callback because it resides in the Microtask queue, which has higher priority',
              'Both execute simultaneously on two CPU cores',
              'It is random depending on network latency',
            ],
            correctAnswer: 1,
            explanation: 'Microtasks (Promises) always drain completely before the Event Loop processes the next task (setTimeout) from the Macrotask queue.',
          },
        ],
      },
    });

    // Lesson 2: Coding Exercise
    const jsAdvL2 = await adminService.createLesson(jsMod2.id, {
      title: 'Practice: Array Deduplication and Frequency Counter',
      slug: 'array-deduplication-frequency',
      order: 2,
      type: 'coding',
      content: `### Practice Exercise: Count Frequency of Elements

Implement a function \`getFrequency(arr)\` that accepts an array of strings or numbers and returns an object mapping each unique element to its frequency count.

#### Example:
- Input: \`["apple", "banana", "apple", "orange", "banana", "apple"]\`
- Output: \`{"apple": 3, "banana": 2, "orange": 1}\`
`,
      learningObjectives: ['Utilize ES6 Objects or Maps for O(N) frequency counting', 'Write clean functional reducers'],
    });

    await adminService.createExercise(jsAdvL2.id, {
      title: 'Array Frequency Function',
      type: 'coding',
      marks: 25,
      isMandatory: true,
      order: 1,
      starterCode: {
        javascript: `function getFrequency(arr) {\n  return arr.reduce((acc, item) => {\n    acc[item] = (acc[item] || 0) + 1;\n    return acc;\n  }, {});\n}\n\nconsole.log(getFrequency(["a", "b", "a", "c", "b", "a"]));\n`,
      },
      hints: ['Use Array.prototype.reduce with an accumulator object.'],
    });

    console.log(`✓ Course seeded: ${jsCourse2.title}`);
  } catch (err: any) {
    console.log(`JS Course 2 setup: ${err.message}`);
  }

  // Create JavaScript Path
  try {
    const jsPath = await adminService.createPath({
      title: 'Modern JavaScript: Foundations to Advanced Architecture',
      slug: 'javascript-mastery',
      description: 'Master modern ECMAScript, scoping, closures, the V8 event loop, microtasks, and resilient asynchronous design patterns.',
      difficulty: 'intermediate',
      estimatedHours: 14,
      tags: ['JavaScript', 'ES6+', 'Frontend', 'Async', 'Full Stack'],
      iconUrl: '/images/tech/javascript.svg',
      status: 'published',
      courseIds: [jsCourse1?.id, jsCourse2?.id].filter((id): id is string => typeof id === 'string'),
    });
    console.log(`✓ Learning Path published: ${jsPath?.title}`);
  } catch (err: any) {
    console.log(`JS Path setup note: ${err.message}`);
  }

  // ==========================================
  // 6. DATA STRUCTURES & ALGORITHMS PATH
  // ==========================================
  console.log('\n--- Seeding Data Structures & Algorithms Path ---');
  try {
    const dsaCourse = await adminService.createCourse({
      title: 'Arrays, Strings & Two-Pointer Techniques',
      slug: 'arrays-and-two-pointers',
      description: 'Master in-place array manipulation, sliding windows, two pointers, and prefix sums for interview excellence.',
      difficulty: 'intermediate',
      estimatedMinutes: 90,
      status: 'published',
    });

    const dsaMod = await adminService.createModule(dsaCourse.id, {
      title: 'Module 1: Two-Pointer & In-Place Space Optimization',
      description: 'Techniques for solving array problems with O(1) auxiliary space.',
      order: 1,
    });

    const dsaLesson = await adminService.createLesson(dsaMod.id, {
      title: 'Two-Pointer Technique Essentials',
      slug: 'two-pointer-technique-essentials',
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
            id: 'dsa-q1',
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
      tags: ['DSA', 'Algorithms', 'Problem Solving', 'Data Structures', 'Competitive Programming'],
      iconUrl: '/images/badges/algo-master.svg',
      status: 'published',
      courseIds: [dsaCourse.id],
    });
    console.log('✓ DSA Mastery path seeded.');
  } catch (err: any) {
    console.log(`DSA Path setup note: ${err.message}`);
  }

  await app.close();
  console.log('\n🎉 Comprehensive Curriculum & Dummy Data Seeding Complete!');
  process.exit(0);
}

bootstrap();
