import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../database/entities/company.entity';
import { Job } from '../database/entities/job.entity';
import { CompanyUser } from '../database/entities/company-user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(CompanyUser) private readonly companyUserRepo: Repository<CompanyUser>,
  ) {}

  async getCompanies() {
    const list = await this.companyRepo.find({
      where: { isVerified: true },
      order: { createdAt: 'DESC' },
    });
    return list.map((c) => ({ ...c, _id: c.id }));
  }

  async getCompanyProfile(username: string) {
    const company = await this.companyRepo.findOne({
      where: { username, isVerified: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const jobs = await this.jobRepo.find({
      where: { company: { id: company.id }, status: 'Published' },
    });

    return { ...company, _id: company.id, jobs: jobs.map((j) => ({ ...j, _id: j.id })) };
  }

  async registerCompany(userId: string, data: any) {
    const { name, username, industry, website } = data;
    const existingCompany = await this.companyRepo.findOne({
      where: { username: username.toLowerCase() },
    });
    if (existingCompany) {
      throw new BadRequestException('Company username already exists');
    }

    const company = this.companyRepo.create({
      name,
      username: username.toLowerCase(),
      industry: industry || '',
      website: website || '',
      createdBy: { id: userId } as any,
    });
    await this.companyRepo.save(company);

    const membership = this.companyUserRepo.create({
      company: { id: company.id } as any,
      user: { id: userId } as any,
      role: 'Owner',
      isActive: true,
    });
    await this.companyUserRepo.save(membership);

    return { success: true, company: { ...company, _id: company.id } };
  }

  async getMyCompanies(userId: string) {
    const memberships = await this.companyUserRepo.find({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      companies: memberships.map((m) => ({
        ...m,
        _id: m.id,
        company: m.company ? { ...m.company, _id: m.company.id } : null,
      })),
    };
  }

  async getCompanyById(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: [{ id: companyId }, { mongoId: companyId }],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return { success: true, company: { ...company, _id: company.id } };
  }

  async updateCompany(companyId: string, updates: any) {
    delete updates.username;
    delete updates.createdBy;

    const company = await this.companyRepo.findOne({
      where: [{ id: companyId }, { mongoId: companyId }],
    });
    if (!company) throw new NotFoundException('Company not found');

    Object.assign(company, updates);
    await this.companyRepo.save(company);
    return { success: true, company: { ...company, _id: company.id } };
  }
}
