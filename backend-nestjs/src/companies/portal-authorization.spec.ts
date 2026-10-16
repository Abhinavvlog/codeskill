jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
import { CompaniesService } from './companies.service';
import { CampusService } from '../campus/campus.service';
import { ForbiddenException } from '@nestjs/common';

describe('Portal tenant profile authorization', () => {
  const actor = { id: 'outsider', role: 'student' };
  const entityRepo = { findOne: jest.fn().mockResolvedValue({ id: 'tenant' }) };
  const membershipRepo = { findOne: jest.fn() };
  const company = new CompaniesService(entityRepo as never, {} as never, membershipRepo as never);
  const campus = new CampusService(entityRepo as never, membershipRepo as never);
  beforeEach(() => membershipRepo.findOne.mockReset());
  it.each([
    ['company', () => company.getCompanyById('tenant', actor)],
    ['university', () => campus.getUniversityById('tenant', actor)],
  ])('denies an unrelated account access to %s', async (_name, read) => {
    membershipRepo.findOne.mockResolvedValue(null);
    await expect((read as () => Promise<unknown>)()).rejects.toThrow(ForbiddenException);
  });
  it('allows an active company member', async () => {
    membershipRepo.findOne.mockResolvedValue({ isActive: true });
    await expect(company.getCompanyById('tenant', actor)).resolves.toMatchObject({ success: true });
    expect(membershipRepo.findOne).toHaveBeenCalledWith({ where: {
      company: { id: 'tenant' }, user: { id: 'outsider' }, isActive: true,
    } });
  });
});
