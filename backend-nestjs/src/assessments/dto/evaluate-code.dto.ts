import { IsString, MaxLength, MinLength } from 'class-validator';

export class EvaluateAssessmentCodeDto {
  @IsString()
  @MinLength(1)
  questionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1_000_000)
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  language: string;
}
