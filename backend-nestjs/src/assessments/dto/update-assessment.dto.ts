import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentSectionDto } from './create-assessment.dto';

class UpdateAssessmentProctoringDto {
  @IsBoolean()
  @IsOptional()
  useCamera?: boolean;

  @IsBoolean()
  @IsOptional()
  enforceFullscreen?: boolean;

  @IsBoolean()
  @IsOptional()
  blockCopyPaste?: boolean;

  @IsBoolean()
  @IsOptional()
  detectTabSwitch?: boolean;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  maxTabSwitches?: number;

  @IsBoolean()
  @IsOptional()
  autoSubmitOnViolation?: boolean;
}

export class UpdateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['mcq', 'coding', 'hybrid'])
  type?: 'mcq' | 'coding' | 'hybrid';

  @IsString()
  @IsOptional()
  @IsEnum(['exam', 'quiz', 'practice', 'recruitment'])
  category?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(5)
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  passingMarks?: number;

  @IsBoolean()
  @IsOptional()
  negativeMarking?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questionIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentSectionDto)
  @IsOptional()
  sections?: AssessmentSectionDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetSections?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetGroups?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetStudentIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetSemesters?: string[];

  @IsOptional()
  startTime?: string;

  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['draft', 'published', 'ongoing', 'completed', 'archived'])
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;

  @IsBoolean()
  @IsOptional()
  showResultImmediately?: boolean;

  @IsBoolean()
  @IsOptional()
  allowReview?: boolean;

  @ValidateNested()
  @Type(() => UpdateAssessmentProctoringDto)
  @IsOptional()
  proctoring?: UpdateAssessmentProctoringDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  allowedAttempts?: number;
}

export class UpdateAssessmentStatusDto {
  @IsString()
  @IsEnum(['draft', 'published', 'ongoing', 'completed', 'archived'])
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';
}
