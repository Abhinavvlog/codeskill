import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';
import { UpdateQuestionDto } from './update-question.dto';

describe('Question DTOs Constraints Validation & Transformation', () => {
  const baseValidDto = {
    question: 'Sample DSA Problem',
    topic: 'Arrays',
    difficulty: 'medium' as const,
    marks: 5,
    questionType: 'DSA',
  };

  describe('CreateQuestionDto', () => {
    it('should successfully validate when constraints is a valid array of strings', async () => {
      const input = {
        ...baseValidDto,
        constraints: [
          '1 ≤ n ≤ 10^5',
          '-10^9 ≤ nums[i] ≤ 10^9',
          '1 ≤ s.length ≤ 10^4',
        ],
      };

      const dto = plainToInstance(CreateQuestionDto, input);
      const errors = await validate(dto);

      expect(errors.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dto.constraints).toEqual([
        '1 ≤ n ≤ 10^5',
        '-10^9 ≤ nums[i] ≤ 10^9',
        '1 ≤ s.length ≤ 10^4',
      ]);
    });

    it('should transform newline-separated string into an array of strings', async () => {
      const input = {
        ...baseValidDto,
        constraints: '1 ≤ n ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9\n1 ≤ s.length ≤ 10^4',
      };

      const dto = plainToInstance(CreateQuestionDto, input);
      const errors = await validate(dto);

      expect(errors.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(Array.isArray(dto.constraints)).toBe(true);
      expect(dto.constraints).toEqual([
        '1 ≤ n ≤ 10^5',
        '-10^9 ≤ nums[i] ≤ 10^9',
        '1 ≤ s.length ≤ 10^4',
      ]);
    });

    it('should trim whitespace and filter out empty lines from multiline string input', async () => {
      const input = {
        ...baseValidDto,
        constraints: '   1 ≤ n ≤ 10^5   \n\n   \n   -10^9 ≤ nums[i] ≤ 10^9   \n   \n',
      };

      const dto = plainToInstance(CreateQuestionDto, input);
      const errors = await validate(dto);

      expect(errors.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dto.constraints).toEqual([
        '1 ≤ n ≤ 10^5',
        '-10^9 ≤ nums[i] ≤ 10^9',
      ]);
    });

    it('should handle empty string and whitespace-only string by transforming to empty array', async () => {
      const inputEmpty = {
        ...baseValidDto,
        constraints: '',
      };
      const dtoEmpty = plainToInstance(CreateQuestionDto, inputEmpty);
      const errorsEmpty = await validate(dtoEmpty);

      expect(errorsEmpty.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dtoEmpty.constraints).toEqual([]);

      const inputWhitespace = {
        ...baseValidDto,
        constraints: '   \n  \n\t  ',
      };
      const dtoWhitespace = plainToInstance(CreateQuestionDto, inputWhitespace);
      const errorsWhitespace = await validate(dtoWhitespace);

      expect(errorsWhitespace.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dtoWhitespace.constraints).toEqual([]);
    });

    it('should pass validation when constraints is empty array or undefined (optional)', async () => {
      const inputEmptyArray = {
        ...baseValidDto,
        constraints: [],
      };
      const dtoEmptyArray = plainToInstance(CreateQuestionDto, inputEmptyArray);
      const errorsEmptyArray = await validate(dtoEmptyArray);

      expect(errorsEmptyArray.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dtoEmptyArray.constraints).toEqual([]);

      const inputMissing = {
        ...baseValidDto,
      };
      const dtoMissing = plainToInstance(CreateQuestionDto, inputMissing);
      const errorsMissing = await validate(dtoMissing);

      expect(errorsMissing.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dtoMissing.constraints).toBeUndefined();
    });

    it('should fail validation when constraints is an invalid data type (number or object)', async () => {
      const inputNumber = {
        ...baseValidDto,
        constraints: 12345,
      };
      const dtoNumber = plainToInstance(CreateQuestionDto, inputNumber);
      const errorsNumber = await validate(dtoNumber);

      const constraintError = errorsNumber.find((e) => e.property === 'constraints');
      expect(constraintError).toBeDefined();
      expect(constraintError?.constraints?.isArray).toBeDefined();

      const inputObject = {
        ...baseValidDto,
        constraints: { min: 1, max: 100 },
      };
      const dtoObject = plainToInstance(CreateQuestionDto, inputObject);
      const errorsObject = await validate(dtoObject);

      const constraintErrorObj = errorsObject.find((e) => e.property === 'constraints');
      expect(constraintErrorObj).toBeDefined();
      expect(constraintErrorObj?.constraints?.isArray).toBeDefined();
    });

    it('should fail validation when constraints array contains non-string items', async () => {
      const inputNonStringArray = {
        ...baseValidDto,
        constraints: ['valid constraint', 1234, true],
      };
      const dtoNonString = plainToInstance(CreateQuestionDto, inputNonStringArray);
      const errorsNonString = await validate(dtoNonString);

      const constraintError = errorsNonString.find((e) => e.property === 'constraints');
      expect(constraintError).toBeDefined();
      expect(constraintError?.constraints?.isString).toBeDefined();
    });
  });

  describe('UpdateQuestionDto', () => {
    it('should validate and transform constraints on UpdateQuestionDto as well', async () => {
      const input = {
        constraints: '1 ≤ n ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9',
      };

      const dto = plainToInstance(UpdateQuestionDto, input);
      const errors = await validate(dto);

      expect(errors.filter((e) => e.property === 'constraints')).toHaveLength(0);
      expect(dto.constraints).toEqual([
        '1 ≤ n ≤ 10^5',
        '-10^9 ≤ nums[i] ≤ 10^9',
      ]);
    });
  });
  it.each([CreateQuestionDto, UpdateQuestionDto])('keeps topic categories and type as separate whitelisted fields in %p', async (Dto) => {
    const input = { ...baseValidDto, categories: ['Arrays', 'Trees'], questionType: 'CODE_OUTPUT' };
    const dto = plainToInstance<CreateQuestionDto | UpdateQuestionDto, typeof input>(Dto, input);
    const errors = await validate(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect(dto.categories).toEqual(['Arrays', 'Trees']);
    expect(dto.questionType).toBe('CODE_OUTPUT');
  });

  it('rejects non-string topic categories', async () => {
    const dto = plainToInstance(CreateQuestionDto, { ...baseValidDto, categories: ['Arrays', 123] });
    const errors = await validate(dto, { whitelist: true });
    expect(errors.some(error => error.property === 'categories')).toBe(true);
  });

});
