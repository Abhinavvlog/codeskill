import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: Array<string | { text: string; isCorrect?: boolean; explanation?: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  correctAnswer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  correctAnswers?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Topic categories only; question type remains a separate field',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtopic?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  negativeMarks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    enum: [
      'single_choice',
      'multiple_choice',
      'coding',
      'algorithmic',
      'MCQ',
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'CODE_OUTPUT',
      'DSA',
    ],
  })
  @IsOptional()
  @IsIn([
    'single_choice',
    'multiple_choice',
    'coding',
    'algorithmic',
    'MCQ',
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'CODE_OUTPUT',
    'DSA',
  ])
  questionType?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected', 'archived', 'active', 'draft'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // --- Extended Fields for Unified Model / Coding / DSA questions ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codeSnippet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  problemStatement?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  examples?: Array<{ input: string; output: string; explanation?: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inputFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outputFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  starterCode?: Array<{ language: string; code: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  functionSignature?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  memoryLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  testCases?: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  referenceSolutions?: Array<{ language: string; sourceCode: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];
}
