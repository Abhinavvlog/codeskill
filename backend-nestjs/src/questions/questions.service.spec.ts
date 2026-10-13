jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => {},
}));

import { BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';

describe('QuestionsService - True/False Questions Handling', () => {
  let service: QuestionsService;
  let mockQuestionRepo: any;
  let mockQuestionBankRepo: any;
  let mockAuditLogRepo: any;

  const mockAdminUser = { id: 'admin-uuid-1', email: 'admin@codeskill.com' };

  beforeEach(() => {
    mockQuestionRepo = {
      create: jest.fn((dto) => ({ id: 'question-uuid-1', ...dto })),
      save: jest.fn(async (entity) => ({ id: 'question-uuid-1', ...entity })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(),
    };

    mockQuestionBankRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockAssessmentRepo: any = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(true),
    };

    mockAuditLogRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn().mockResolvedValue(true),
    };

    service = new QuestionsService(
      mockQuestionRepo,
      mockQuestionBankRepo,
      mockAssessmentRepo,
      mockAuditLogRepo,
      { invalidatePrefix: jest.fn().mockResolvedValue(undefined) } as never,
    );
  });

  describe('create - True/False Questions', () => {
    it('should successfully create a True/False question with True as correct answer', async () => {
      const dto: any = {
        question: 'Is JavaScript single-threaded?',
        topic: 'JavaScript',
        difficulty: 'easy',
        questionType: 'TRUE_FALSE',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
        marks: 2,
      };

      const result = await service.create(dto, mockAdminUser);
      expect(result.options).toEqual(['True', 'False']);
      expect(result.correctAnswer).toBe(0);
      expect(result.correctAnswers).toEqual([0]);
    });

    it('should successfully create a True/False question with False as correct answer', async () => {
      const dto: any = {
        question: 'Is HTML a programming language?',
        topic: 'Web',
        difficulty: 'easy',
        questionType: 'TRUE_FALSE',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true },
        ],
        marks: 1,
      };

      const result = await service.create(dto, mockAdminUser);
      expect(result.options).toEqual(['True', 'False']);
      expect(result.correctAnswer).toBe(1);
      expect(result.correctAnswers).toEqual([1]);
    });

    it('should reject True/False question if more than 2 options are provided', async () => {
      const dto: any = {
        question: 'Invalid T/F question',
        topic: 'General',
        questionType: 'TRUE_FALSE',
        options: ['True', 'False', 'Maybe', 'Neither'],
      };

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        'True/False questions must contain exactly two options: True and False',
      );
    });

    it('should reject True/False question if less than 2 options are provided', async () => {
      const dto: any = {
        question: 'Invalid T/F question',
        topic: 'General',
        questionType: 'TRUE_FALSE',
        options: ['True'],
      };

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject True/False question if options do not contain True and False', async () => {
      const dto: any = {
        question: 'Invalid T/F options',
        topic: 'General',
        questionType: 'TRUE_FALSE',
        options: ['Yes', 'No'],
      };

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        'True/False questions must contain True and False options',
      );
    });

    it('should reject True/False question if duplicate options are provided', async () => {
      const dto: any = {
        question: 'Duplicate T/F options',
        topic: 'General',
        questionType: 'TRUE_FALSE',
        options: ['True', 'True'],
      };

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        'True/False questions cannot have duplicate options',
      );
    });

    it('should reject True/False question if multiple correct answers are flagged', async () => {
      const dto: any = {
        question: 'Both marked correct',
        topic: 'General',
        questionType: 'TRUE_FALSE',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: true },
        ],
      };

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        'True/False questions cannot have more than one correct answer',
      );
    });

    it('should reject True/False question if correctAnswer index is out of bounds', async () => {
      const dto: any = {
        question: 'Invalid index',
        topic: 'General',
        questionType: 'TRUE_FALSE',
        options: ['True', 'False'],
        correctAnswer: 2,
      };

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(
        'correctAnswer for True/False must be 0 (True) or 1 (False)',
      );
    });
  });

  describe('update - True/False Questions', () => {
    it('should update True/False question and toggle correct answer to False', async () => {
      mockQuestionRepo.findOne.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        question: 'Original Question',
        questionType: 'TRUE_FALSE',
        options: ['True', 'False'],
        correctAnswer: 0,
        correctAnswers: [0],
        status: 'approved',
      });

      const updateDto: any = {
        question: 'Updated Question',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true },
        ],
        correctAnswer: 1,
      };

      const result = await service.update(
        '11111111-1111-1111-1111-111111111111',
        updateDto,
        mockAdminUser,
      );

      expect(result.options).toEqual(['True', 'False']);
      expect(result.correctAnswer).toBe(1);
      expect(result.correctAnswers).toEqual([1]);
    });

    it('should reject update if attempting to add 4 options to a True/False question', async () => {
      mockQuestionRepo.findOne.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        question: 'Original Question',
        questionType: 'TRUE_FALSE',
        options: ['True', 'False'],
        correctAnswer: 0,
        status: 'approved',
      });

      const updateDto: any = {
        options: ['True', 'False', 'Option 3', 'Option 4'],
      };

      await expect(
        service.update(
          '11111111-1111-1111-1111-111111111111',
          updateDto,
          mockAdminUser,
        ),
      ).rejects.toThrow(
        'True/False questions must contain exactly two options: True and False',
      );
    });
  });

  describe('findById - Existing Data Normalization', () => {
    it('should normalize legacy True/False question with 4 options to exactly True and False', async () => {
      mockQuestionRepo.findOne.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        question: 'Legacy Question with 4 options',
        questionType: 'TRUE_FALSE',
        options: ['True', 'False', 'Option C', 'Option D'],
        correctAnswer: 1, // False
        status: 'approved',
      });

      const result = await service.findById(
        '11111111-1111-1111-1111-111111111111',
        false,
      );

      expect(result.options).toEqual(['True', 'False']);
      expect(result.options).toHaveLength(2);
      expect(result.correctAnswer).toBe(1);
      expect(result.correctAnswers).toEqual([1]);
    });

    it('should preserve correct answer True (0) when normalizing legacy True/False question', async () => {
      mockQuestionRepo.findOne.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        question: 'Legacy Question',
        questionType: 'TRUE_FALSE',
        options: ['True', 'False', 'True', 'False'],
        correctAnswer: 0, // True
        status: 'approved',
      });

      const result = await service.findById(
        '11111111-1111-1111-1111-111111111111',
        false,
      );

      expect(result.options).toEqual(['True', 'False']);
      expect(result.correctAnswer).toBe(0);
    });
  });

  describe('Preserve Multiple Choice Questions', () => {
    it('should allow multiple choice question with 4 configurable options', async () => {
      const dto: any = {
        question: 'Which of the following are sorting algorithms?',
        topic: 'Algorithms',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { text: 'Merge Sort', isCorrect: true },
          { text: 'Quick Sort', isCorrect: true },
          { text: 'Binary Search', isCorrect: false },
          { text: 'DFS', isCorrect: false },
        ],
        marks: 4,
      };

      const result = await service.create(dto, mockAdminUser);
      expect(result.options).toEqual([
        'Merge Sort',
        'Quick Sort',
        'Binary Search',
        'DFS',
      ]);
      expect(result.correctAnswers).toEqual([0, 1]);
    });
  });
  describe('Topic categories and independent question types', () => {
    it('stores every topic in metadata, deduplicated, without a type tag', async () => {
      const question = await service.create({ question: 'Coding task', topic: 'Arrays', categories: ['Arrays', ' Trees ', 'Arrays'], questionType: 'DSA', marks: 1 }, mockAdminUser);
      expect(question.questionType).toBe('DSA');
      expect(question.topic).toBe('Arrays');
      expect(question.metadata.categories).toEqual(['Arrays', 'Trees']);
      expect(question).not.toHaveProperty('categories');
    });

    it('updates category metadata while preserving unrelated metadata', async () => {
      mockQuestionRepo.findOne.mockResolvedValue({ id: 'question-uuid-1', question: 'Task', questionType: 'DSA', topic: 'Arrays', options: [], metadata: { categories: ['Arrays'], imported: true } });
      await service.update('question-uuid-1', { categories: ['Trees', 'Graphs'], questionType: 'CODE_OUTPUT' }, mockAdminUser);
      expect(mockQuestionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ questionType: 'CODE_OUTPUT', topic: 'Trees', metadata: { categories: ['Trees', 'Graphs'], imported: true } }));
    });

    it('keeps legacy topic-only creates compatible', async () => {
      const question = await service.create({ question: 'Task', topic: 'Strings', questionType: 'DSA' }, mockAdminUser);
      expect(question.topic).toBe('Strings');
      expect(question.metadata?.categories).toBeUndefined();
    });

    it.each([
      ['MCQ', ['MCQ', 'single_choice']],
      ['MULTIPLE_CHOICE', ['MULTIPLE_CHOICE', 'multiple_choice']],
      ['TRUE_FALSE', ['TRUE_FALSE', 'true_false']],
      ['CODE_OUTPUT', ['CODE_OUTPUT', 'code_output']],
      ['DSA', ['DSA', 'coding', 'algorithmic']],
    ])('filters %s across legacy and unified values', async (type, aliases) => {
      const qb = { leftJoinAndSelect: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), take: jest.fn().mockReturnThis(), getManyAndCount: jest.fn().mockResolvedValue([[], 0]) };
      mockQuestionRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ questionType: type as string });
      expect(qb.andWhere).toHaveBeenCalledWith('question.questionType IN (:...questionTypes)', { questionTypes: aliases });
    });
  });

  describe('parseAndValidateQuestionsImport & confirmQuestionsImport', () => {
    it('successfully parses coding questions with starter codes, test cases, and problem statement', async () => {
      mockQuestionRepo.find.mockResolvedValue([]);

      const csv = [
        'title,question_type,language,supported_languages,topic,subtopic,difficulty,marks,constraints,problem_statement,sample_input,sample_output,explanation,test_input_1,test_output_1,test_input_2,test_output_2,starter_code_c,starter_code_cpp,starter_code_java,starter_code_python,tags',
        '"Evaluate Expression",coding,NA,"C, C++, Java, Python","Data Structures",Stack,Easy,10,"1 <= T <= 100","You are given a string S in Reverse Polish Notation. Evaluate it using stack.","4\n3\n73-","4","Postfix stack eval","3\n73-",4,"7\n04*3*0-",0,"#include <stdio.h>","#include <bits/stdc++.h>","import java.util.*;","T = int(input())","postfix,stack"',
      ].join('\n');

      const result = await service.parseAndValidateQuestionsImport(Buffer.from(csv, 'utf8'));

      expect(result.summary.totalRows).toBe(1);
      expect(result.summary.validCount).toBe(1);
      expect(result.summary.invalidCount).toBe(0);
      expect(result.validRows[0].title).toBe('Evaluate Expression');
      expect(result.validRows[0].questionType).toBe('coding');
      expect(result.validRows[0].testCases).toHaveLength(2);
      expect(result.validRows[0].starterCode).toHaveLength(4);
      expect(result.validRows[0].supportedLanguages).toEqual(['C', 'C++', 'Java', 'Python']);
    });

    it('successfully parses and validates the complete 66-column Chandigarh University coding question schema', async () => {
      mockQuestionRepo.find.mockResolvedValue([]);

      const header =
        'question_id,title,slug,question_type,topic,subtopic,difficulty,marks,negative_marks,language,supported_languages,constraints,problem_statement,input_format,output_format,sample_input,sample_output,explanation,hints,approach,expected_time_complexity,expected_space_complexity,starter_code_c,starter_code_cpp,starter_code_java,starter_code_python,starter_code_javascript,starter_code_go,starter_code_rust,solution_code_c,solution_code_cpp,solution_code_java,solution_code_python,solution_code_javascript,solution_code_go,solution_code_rust,test_input_1,test_output_1,test_visibility_1,test_input_2,test_output_2,test_visibility_2,test_input_3,test_output_3,test_visibility_3,test_input_4,test_output_4,test_visibility_4,test_input_5,test_output_5,test_visibility_5,time_limit_ms,memory_limit_mb,execution_mode,entry_point,function_name,return_type,input_type,output_type,allow_custom_input,compare_mode,partial_scoring,is_active,tags,created_by,version';

      const row = [
        '""',
        '"Two Sum"',
        '"two-sum"',
        '"coding"',
        '"Data Structures"',
        '"Arrays"',
        '"easy"',
        '10',
        '0',
        '"all"',
        '"c,cpp,java,python,javascript,go,rust"',
        '"2 <= N <= 10^4"',
        '"Given array nums and target, return indices summing to target."',
        '"N followed by N integers and target"',
        '"Two space-separated indices"',
        '"4\\n2 7 11 15\\n9"',
        '"0 1"',
        '"2+7=9"',
        '"Use hash map"',
        '"One pass hash table"',
        '"O(N)"',
        '"O(N)"',
        '"#include <stdio.h>"',
        '"#include <iostream>"',
        '"public class Main {}"',
        '"def solve(): pass"',
        '"console.log(0);"',
        '"package main"',
        '"fn main() {}"',
        '"#include <stdio.h> solution"',
        '"#include <iostream> solution"',
        '"public class Solution {}"',
        '"def solve(): return [0, 1]"',
        '"console.log(\\"0 1\\");"',
        '"package main func solve() {}"',
        '"fn solve() {}"',
        '"4\\n2 7 11 15\\n9"',
        '"0 1"',
        '"sample"',
        '"3\\n3 2 4\\n6"',
        '"1 2"',
        '"sample"',
        '"2\\n3 3\\n6"',
        '"0 1"',
        '"hidden"',
        '"4\\n1 2 3 4\\n7"',
        '"2 3"',
        '"hidden"',
        '"5\\n-1 -2 -3 -4 -5\\n-9"',
        '"3 4"',
        '"hidden"',
        '2000',
        '256',
        '"standard"',
        '"main"',
        '"twoSum"',
        '"int[]"',
        '"int[], int"',
        '"int[]"',
        'true',
        '"exact"',
        'false',
        'true',
        '"arrays,hash-map"',
        '"Chandigarh University"',
        '"1.0"',
      ].join(',');

      const csvContent = `${header}\n${row}`;
      const result = await service.parseAndValidateQuestionsImport(
        Buffer.from(csvContent, 'utf8'),
      );

      expect(result.summary.validCount).toBe(1);
      expect(result.summary.invalidCount).toBe(0);
      const parsed = result.validRows[0];
      expect(parsed.title).toBe('Two Sum');
      expect(parsed.slug).toBe('two-sum');
      expect(parsed.questionType).toBe('coding');
      expect(parsed.starterCode.length).toBe(7);
      expect(parsed.referenceSolutions.length).toBe(7);
      expect(parsed.testCases.length).toBe(5);
      expect(parsed.testCases[0].isHidden).toBe(false);
      expect(parsed.testCases[1].isHidden).toBe(false);
      expect(parsed.testCases[2].isHidden).toBe(true);
      expect(parsed.testCases[3].isHidden).toBe(true);
      expect(parsed.testCases[4].isHidden).toBe(true);
      expect(parsed.timeLimit).toBe(2000);
      expect(parsed.memoryLimit).toBe(256);
      expect(parsed.functionName).toBe('twoSum');
      expect(parsed.returnType).toBe('int[]');
    });
  });

});

