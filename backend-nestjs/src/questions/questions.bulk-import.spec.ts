jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));

import { QuestionsService } from './questions.service';
import * as xlsx from 'xlsx';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Questions Bulk Import & Merge Strategy', () => {
  let service: QuestionsService;
  let questionRepo: any;
  let questionBankRepo: any;
  let auditLogRepo: any;
  let cacheService: any;

  const admin = { id: 'admin-uuid-1', email: 'admin@codeskill.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    questionRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: any) => ({ id: 'new-q-uuid', ...data })),
      save: jest.fn((data: any) => Promise.resolve(data)),
      manager: {
        transaction: jest.fn(async (cb: any) => {
          return cb({
            findOne: jest.fn((entityOrOpts: any, maybeOpts?: any) => {
              const opts = maybeOpts || entityOrOpts;
              return questionRepo.findOne(opts);
            }),
            create: questionRepo.create,
            save: jest.fn((data: any) => Promise.resolve(data)),
          });
        }),
      },
    };
    questionBankRepo = {};
    auditLogRepo = {
      create: jest.fn((data: any) => data),
      save: jest.fn().mockResolvedValue(true),
    };
    cacheService = {
      invalidatePrefix: jest.fn().mockResolvedValue(undefined),
    };

    service = new QuestionsService(
      questionRepo as any,
      questionBankRepo as any,
      auditLogRepo as any,
      cacheService as any,
    );
  });

  const createWorkbookBuffer = (rows: Record<string, any>[]): Buffer => {
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Questions');
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  };

  it('imports complete coding workbook columns through preview and commit', async () => {
    const buffer = createWorkbookBuffer([{
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      question_type: 'coding',
      topic: 'Data Structures',
      language_cpp: 1,
      language_java: 1,
      language_python: 1,
      problem_statement: 'Check whether brackets are balanced.',
      input_format: 'One bracket string.',
      output_format: 'Print true or false.',
      solution_explanation: 'Use a stack.',
      time_complexity: 'O(n)',
      space_complexity: 'O(n)',
      visibility: 'Published',
      sample_input_1: '()[]{}',
      sample_output_1: 'true',
      sample_input_2: '(]',
      sample_output_2: 'false',
      test_input_1: '([)]',
      test_expected_output_1: 'false',
      test_hidden_1: 0,
      test_weight_1: 2,
      test_input_2: '{[]}',
      test_expected_output_2: 'true',
      test_hidden_2: 1,
      starter_code_cpp: 'int main() {}',
      starter_code_java: 'class Main {}',
      starter_code_python: 'def main(): pass',
      reference_solution_cpp: 'int main() { return 0; }',
      reference_solution_java: 'class Main { public static void main(String[] args) {} }',
      reference_solution_python: 'print(True)',
    }]);

    const preview = await service.parseAndValidateQuestionsImport(buffer);
    expect(preview.errors).toEqual([]);
    expect(preview.summary.validCount).toBe(1);
    expect(preview.validRows[0]).toMatchObject({
      slug: 'valid-parentheses',
      language: 'python3',
      supportedLanguages: ['cpp', 'java', 'python3'],
      examples: [{ input: '()[]{}', output: 'true' }, { input: '(]', output: 'false' }],
      testCases: [
        { input: '([)]', output: 'false', isHidden: false, weight: 2 },
        { input: '{[]}', output: 'true', isHidden: true },
      ],
    });

    await service.confirmQuestionsImport(preview.validRows, admin);
    expect(questionRepo.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      slug: 'valid-parentheses',
      title: 'Valid Parentheses',
      supportedLanguages: ['cpp', 'java', 'python3'],
      starterCode: expect.arrayContaining([{ language: 'cpp', code: 'int main() {}' }]),
      referenceSolutions: expect.arrayContaining([{ language: 'python3', sourceCode: 'print(True)' }]),
      testCases: expect.arrayContaining([{ id: '2', input: '{[]}', expectedOutput: 'true', isHidden: true, weight: 1 }]),
      metadata: expect.objectContaining({ timeComplexity: 'O(n)', spaceComplexity: 'O(n)' }),
    }));
  });

  it.each(['csv', 'xlsx'])('accepts the downloadable coding template as %s', async (extension) => {
    const path = join(
      process.cwd(),
      '..',
      'frontend-v2',
      'public',
      'templates',
      `chandigarh_university_coding_questions_template.${extension}`,
    );
    const preview = await service.parseAndValidateQuestionsImport(readFileSync(path));
    expect(preview.errors).toEqual([]);
    expect(preview.summary.validCount).toBe(1);
    expect(preview.validRows[0].supportedLanguages).toEqual(['cpp', 'java', 'python3']);
    expect(preview.validRows[0].testCases).toHaveLength(2);
    expect(preview.validRows[0].referenceSolutions).toHaveLength(3);
  });

  it('accepts coding CSVs with Excel-width empty trailing columns and blank rows', async () => {
    const template = readFileSync(join(process.cwd(), '..', 'frontend-v2', 'public', 'templates',
      'chandigarh_university_coding_questions_template.csv'));
    const workbook = xlsx.read(template, { type: 'buffer' });
    const rows = xlsx.utils.sheet_to_json<string[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    const csv = [...rows, ...Array.from({ length: 12 }, () => [] as string[])].map(row =>
      Array.from({ length: 16384 }, (_, index) => `"${String(row[index] ?? '').replace(/"/g, '""')}"`).join(','),
    ).join('\n');
    const preview = await service.parseAndValidateQuestionsImport(Buffer.from(csv));
    expect(preview.errors).toEqual([]);
    expect(preview.summary.validCount).toBe(1);
    expect(preview.validRows[0].examples).toHaveLength(2);
    expect(preview.validRows[0].testCases).toHaveLength(2);
    expect(preview.validRows[0].referenceSolutions).toHaveLength(3);
  });

  it('updates execution limits together with imported coding content', async () => {
    const existing = { id: 'existing', question: 'Limits', topic: 'Arrays', timeLimit: 1000, memoryLimit: 128 };
    questionRepo.findOne.mockResolvedValue(existing);
    await service.confirmQuestionsImport([{
      question: 'Limits', topic: 'Arrays', questionType: 'coding',
      existingQuestionId: existing.id, timeLimit: 4500, memoryLimit: 512,
      testCases: [{ input: '1', output: '1', isHidden: false }],
    }], admin, '', '', 'update');
    expect(existing).toMatchObject({ timeLimit: 4500, memoryLimit: 512 });
  });


  it('normalizes whitespace, case, and punctuation to detect exact duplicates via content hash', () => {
    const text1 = 'What is the   time complexity of QuickSort?';
    const text2 = 'what is the time complexity of quicksort ';
    const hash1 = service.calculateContentHash(text1, 'single_choice', 'Algorithms');
    const hash2 = service.calculateContentHash(text2, 'single_choice', 'algorithms');
    expect(hash1).toBe(hash2);
  });

  it('detects option-aware conflicts when correct answer or options differ', async () => {
    // Database contains an existing question
    questionRepo.find.mockResolvedValue([
      {
        id: 'q-existing-1',
        question: 'What is the capital of France?',
        questionType: 'single_choice',
        topic: 'General Knowledge',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 1, // 'Paris'
      },
    ]);

    const rows = [
      {
        question: 'What is the capital of France?', // same stem
        question_type: 'single_choice',
        topic: 'General Knowledge',
        option_a: 'London',
        option_b: 'Paris',
        option_c: 'Berlin',
        option_d: 'Madrid',
        correct_answer: 'B', // same answer: Paris -> exact duplicate
      },
      {
        question: 'What is the capital of France?', // duplicate within file
        question_type: 'single_choice',
        topic: 'General Knowledge',
        option_a: 'London',
        option_b: 'Rome', // changed option
        option_c: 'Berlin',
        option_d: 'Madrid',
        correct_answer: 'A', // different answer!
      },
    ];

    const buffer = createWorkbookBuffer(rows);
    const result = await service.parseAndValidateQuestionsImport(buffer);

    expect(result.summary.exactDuplicateCount).toBe(1);
    expect(result.summary.duplicateCount).toBe(1); // duplicate within file
    expect(result.validRows.length).toBe(1);
    expect(result.validRows[0].matchStatus).toBe('exact_duplicate');
  });

  it('mergeStrategy="skip" preserves existing questions and inserts new ones', async () => {
    const validRows = [
      {
        rowNumber: 2,
        question: 'Existing question in bank',
        questionType: 'single_choice',
        topic: 'Databases',
        existingQuestionId: 'existing-id-123',
        matchStatus: 'exact_duplicate',
        options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
        correctAnswer: 0,
      },
      {
        rowNumber: 3,
        question: 'Brand new question',
        questionType: 'single_choice',
        topic: 'Databases',
        matchStatus: 'new',
        options: [{ text: 'X', isCorrect: true }, { text: 'Y', isCorrect: false }],
        correctAnswer: 0,
      },
    ];

    questionRepo.findOne.mockImplementation(({ where }: any) => {
      if (where.id === 'existing-id-123') {
        return Promise.resolve({
          id: 'existing-id-123',
          question: 'Existing question in bank',
          topic: 'Databases',
        });
      }
      return Promise.resolve(null);
    });

    const result = await service.confirmQuestionsImport(
      validRows,
      admin,
      '127.0.0.1',
      'test-agent',
      'skip',
    );

    expect(result.success).toBe(true);
    expect(result.insertedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.updatedCount).toBe(0);
  });

  it('mergeStrategy="update" updates existing question in-place while strictly preserving question ID', async () => {
    const existingRecord = {
      id: 'existing-id-preserve-me',
      question: 'Old Question Text',
      topic: 'Databases',
      options: ['Old A', 'Old B'],
      correctAnswer: 0,
    };

    questionRepo.findOne.mockResolvedValue(existingRecord);

    const validRows = [
      {
        rowNumber: 2,
        question: 'Updated Question Text',
        questionType: 'single_choice',
        topic: 'Databases',
        existingQuestionId: 'existing-id-preserve-me',
        matchStatus: 'exact_duplicate',
        options: [{ text: 'New A', isCorrect: false }, { text: 'New B', isCorrect: true }],
        correctAnswer: 1,
        explanation: 'Updated explanation',
      },
    ];

    const result = await service.confirmQuestionsImport(
      validRows,
      admin,
      '127.0.0.1',
      'test-agent',
      'update',
    );

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(existingRecord.id).toBe('existing-id-preserve-me'); // ID preserved!
    expect(existingRecord.question).toBe('Updated Question Text');
    expect(existingRecord.explanation).toBe('Updated explanation');
  });

  it('mergeStrategy="merge" enriches missing metadata without overwriting correct answers or options', async () => {
    const existingRecord = {
      id: 'existing-id-merge',
      question: 'Existing question',
      topic: 'Databases',
      options: ['Option 1', 'Option 2'],
      correctAnswer: 0, // Option 1
      explanation: '', // empty
      subtopic: '', // empty
      tags: ['db'],
    };

    questionRepo.findOne.mockResolvedValue(existingRecord);

    const validRows = [
      {
        rowNumber: 2,
        question: 'Existing question',
        questionType: 'single_choice',
        topic: 'Databases',
        existingQuestionId: 'existing-id-merge',
        matchStatus: 'exact_duplicate',
        options: [{ text: 'Different Option A', isCorrect: false }, { text: 'Different Option B', isCorrect: true }],
        correctAnswer: 1, // should NOT overwrite existing
        explanation: 'Newly provided explanation',
        subtopic: 'Indexing',
        tags: ['b-tree'],
      },
    ];

    const result = await service.confirmQuestionsImport(
      validRows,
      admin,
      '127.0.0.1',
      'test-agent',
      'merge',
    );

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(existingRecord.correctAnswer).toBe(0); // preserved!
    expect(existingRecord.options).toEqual(['Option 1', 'Option 2']); // preserved!
    expect(existingRecord.explanation).toBe('Newly provided explanation'); // enriched!
    expect(existingRecord.subtopic).toBe('Indexing'); // enriched!
    expect(existingRecord.tags).toContain('b-tree'); // merged!
  });
});
