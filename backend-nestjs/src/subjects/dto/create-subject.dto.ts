import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'CS301', description: 'Unique subject code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Data Structures & Algorithms', description: 'Subject name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Fundamental data structures and algorithms in CS' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 3, description: 'Semester number (1-12)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  semester?: number;

  @ApiPropertyOptional({ example: 'Computer Science & Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'CS301' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Data Structures & Algorithms' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  semester?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
