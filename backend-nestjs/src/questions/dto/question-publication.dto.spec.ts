import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuestionDto } from './create-question.dto';
import { UpdateQuestionDto } from './update-question.dto';

const base = { question: 'Two Sum', topic: 'Arrays', questionType: 'DSA' };
const dtoTypes = [CreateQuestionDto, UpdateQuestionDto];

describe('Question publication DTO validation', () => {
  it.each(dtoTypes)(
    'whitelists explicit publication fields, title and slug in %p without allowing raw metadata',
    async (Dto) => {
      const dto = plainToInstance<
        CreateQuestionDto | UpdateQuestionDto,
        Record<string, unknown>
      >(
        Dto,
        {
          ...base,
          title: 'Two Sum',
          slug: 'two-sum',
          visibility: 'Published',
          contestOnly: false,
          categories: ['Arrays', 'Graphs'],
          metadata: { visibility: 'Public', arbitrary: 'untrusted' },
          publishing: { publishImmediately: true },
        },
        { enableImplicitConversion: true },
      );
      expect(await validate(dto, { whitelist: true })).toHaveLength(0);
      expect(dto.title).toBe('Two Sum');
      expect(dto.slug).toBe('two-sum');
      expect(dto.visibility).toBe('Published');
      expect(dto.contestOnly).toBe(false);
      expect(dto.categories).toEqual(['Arrays', 'Graphs']);
      expect(dto).not.toHaveProperty('metadata');
      expect(dto).not.toHaveProperty('publishing');
    },
  );

  it.each(dtoTypes)(
    'accepts only the declared visibility choices in %p',
    async (Dto) => {
      for (const visibility of ['Draft', 'Private', 'Published', 'Public']) {
        const dto = plainToInstance<
          CreateQuestionDto | UpdateQuestionDto,
          Record<string, unknown>
        >(Dto, { ...base, visibility });
        expect(await validate(dto, { whitelist: true })).toHaveLength(0);
      }
      for (const visibility of ['approved', 'active', '', 1, null]) {
        const dto = plainToInstance<
          CreateQuestionDto | UpdateQuestionDto,
          Record<string, unknown>
        >(Dto, { ...base, visibility }, { enableImplicitConversion: true });
        expect(
          (await validate(dto)).some(
            (error) => error.property === 'visibility',
          ),
        ).toBe(true);
      }
    },
  );

  it.each(dtoTypes)(
    'requires a real boolean for contestOnly in %p, including with implicit conversion enabled',
    async (Dto) => {
      for (const contestOnly of [true, false]) {
        const dto = plainToInstance<
          CreateQuestionDto | UpdateQuestionDto,
          Record<string, unknown>
        >(Dto, { ...base, contestOnly }, { enableImplicitConversion: true });
        expect(await validate(dto, { whitelist: true })).toHaveLength(0);
        expect(dto.contestOnly).toBe(contestOnly);
      }
      for (const contestOnly of ['false', 'true', 0, 1, null, {}]) {
        const dto = plainToInstance<
          CreateQuestionDto | UpdateQuestionDto,
          Record<string, unknown>
        >(Dto, { ...base, contestOnly }, { enableImplicitConversion: true });
        expect(
          (await validate(dto)).some(
            (error) => error.property === 'contestOnly',
          ),
        ).toBe(true);
      }
    },
  );

  it.each(dtoTypes)(
    'preserves absence of publishing controls and rejects invalid statuses in %p',
    async (Dto) => {
      const dto = plainToInstance<
        CreateQuestionDto | UpdateQuestionDto,
        typeof base
      >(Dto, base);
      expect(await validate(dto, { whitelist: true })).toHaveLength(0);
      expect(dto.visibility).toBeUndefined();
      expect(dto.contestOnly).toBeUndefined();
      const invalid = plainToInstance<
        CreateQuestionDto | UpdateQuestionDto,
        Record<string, unknown>
      >(Dto, { ...base, status: 'anything' });
      expect(
        (await validate(invalid)).some((error) => error.property === 'status'),
      ).toBe(true);
    },
  );
});
