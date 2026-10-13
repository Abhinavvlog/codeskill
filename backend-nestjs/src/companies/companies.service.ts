import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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

  async getCompanyById(
    companyId: string,
    actor?: { id?: string; role?: string; isAdmin?: boolean },
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    const whereConditions: any[] = isUuid
      ? [{ id: companyId }, { mongoId: companyId }]
      : [{ username: companyId.toLowerCase() }, { mongoId: companyId }];

    const company = await this.companyRepo.findOne({
      where: whereConditions,
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.isVerified && actor?.id) {
      const isPlatformAdmin = actor.isAdmin || actor.role === 'admin' || actor.role === 'super_admin';
      if (!isPlatformAdmin) {
        const membership = await this.companyUserRepo.findOne({
          where: { company: { id: company.id }, user: { id: actor.id }, isActive: true },
        });
        if (!membership) {
          throw new ForbiddenException('Access denied to unverified company');
        }
      }
    }

    return { success: true, company: { ...company, _id: company.id } };
  }

  async updateCompany(
    companyId: string,
    updates: any,
    actor?: { id?: string; role?: string; isAdmin?: boolean },
  ) {
    const company = await this.companyRepo.findOne({
      where: [{ id: companyId }, { mongoId: companyId }],
    });
    if (!company) throw new NotFoundException('Company not found');

    if (actor) {
      const isPlatformAdmin =
        actor.isAdmin ||
        ['admin', 'super_admin', 'company_admin'].includes(actor.role || '');

      if (!isPlatformAdmin) {
        const membership = await this.companyUserRepo.findOne({
          where: {
            company: { id: company.id },
            user: { id: actor.id },
            isActive: true,
          },
        });
        if (!membership || !['Owner', 'Admin'].includes(membership.role)) {
          throw new ForbiddenException(
            'You do not have management permissions for this company',
          );
        }
      }
    }

    // Strip protected fields to prevent mass assignment (NEW-004)
    delete updates.id;
    delete updates.mongoId;
    delete updates.username;
    delete updates.createdBy;
    delete updates.created_by_id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // isVerified can only be modified by platform super_admin / admin
    if (
      updates.isVerified !== undefined &&
      (!actor || (!actor.isAdmin && !['admin', 'super_admin'].includes(actor.role || '')))
    ) {
      delete updates.isVerified;
    }

    Object.assign(company, updates);
    await this.companyRepo.save(company);
    return { success: true, company: { ...company, _id: company.id } };
  }
}
