import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsNumber,
  IsOptional,
  IsIn,
  ArrayUnique,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  question?: string;

  @ApiProperty({
    example: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    description: 'Array of options',
  })
  @IsOptional()
  @IsArray()
  options?: Array<string | { text: string; isCorrect?: boolean; explanation?: string }>;

  @ApiPropertyOptional({
    example: 1,
    description: 'Zero-based index of the correct option (0, 1, 2, or 3)',
  })
  @IsOptional()
  @IsNumber()
  correctAnswer?: number;

  @ApiPropertyOptional({
    example:
      'Binary search repeatedly divides the search interval in half, leading to O(log n) time complexity.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ example: 'Data Structures & Algorithms' })
  @IsNotEmpty()
  @IsString()
  topic: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Topic categories only; question type remains a separate field',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ example: 'Searching Algorithms' })
  @IsOptional()
  @IsString()
  subtopic?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard' = 'medium';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  marks?: number = 1;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  negativeMarks?: number = 0;

  @ApiPropertyOptional({ default: 'general' })
  @IsOptional()
  @IsString()
  language?: string = 'general';

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
    default: 'single_choice',
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
  questionType?: string = 'single_choice';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['binary-search', 'algorithms', 'time-complexity'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // --- Extended Fields for Unified Model (Phase 1) ---

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
  @IsArray()
  @IsNumber({}, { each: true })
  correctAnswers?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

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
