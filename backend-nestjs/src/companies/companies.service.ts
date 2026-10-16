import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../database/entities/company.entity';
import { Job } from '../database/entities/job.entity';
import { CompanyUser } from '../database/entities/company-user.entity';
import { Application } from '../database/entities/application.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(CompanyUser) private readonly companyUserRepo: Repository<CompanyUser>,
    @Optional()
    @InjectRepository(Application)
    private readonly applicationRepo?: Repository<Application>,
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
    const company = await this.companyRepo.findOne({
      where: [{ id: companyId }, { mongoId: companyId }],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (actor) {
      const isPlatformAdmin =
        actor.isAdmin ||
        ['admin', 'super_admin'].includes(actor.role || '');

      if (!isPlatformAdmin) {
        const membership = await this.companyUserRepo.findOne({
          where: {
            company: { id: company.id },
            user: { id: actor.id },
            isActive: true,
          },
        });
        if (!membership) {
          throw new ForbiddenException(
            'You do not have permission to access this company',
          );
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

  private async assertCompanyMembership(
    companyId: string,
    actor: { id?: string; role?: string; isAdmin?: boolean },
    requiredRoles?: string[],
  ): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: [{ id: companyId }, { mongoId: companyId }],
    });
    if (!company) throw new NotFoundException('Company not found');

    const isPlatformAdmin =
      actor?.isAdmin ||
      ['admin', 'super_admin'].includes(actor?.role || '');

    if (!isPlatformAdmin) {
      const membership = await this.companyUserRepo.findOne({
        where: {
          company: { id: company.id },
          user: { id: actor?.id },
          isActive: true,
        },
      });
      if (!membership) {
        throw new ForbiddenException(
          'You do not have permission to access this company',
        );
      }
      if (requiredRoles && !requiredRoles.includes(membership.role)) {
        throw new ForbiddenException(
          'Insufficient permissions for this company action',
        );
      }
    }

    return company;
  }

  async getJobs(companyId: string, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor);
    const jobs = await this.jobRepo.find({
      where: { company: { id: company.id } },
      order: { createdAt: 'DESC' },
    });
    return {
      success: true,
      jobs: jobs.map((j) => ({ ...j, _id: j.id })),
    };
  }

  async createJob(companyId: string, data: any, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor, [
      'Owner',
      'Admin',
    ]);
    const job = this.jobRepo.create({
      ...data,
      company: { id: company.id } as any,
      company_id: company.id,
      createdBy: { id: actor?.id } as any,
      created_by_id: actor?.id,
    }) as unknown as Job;
    const saved = await this.jobRepo.save(job);
    return { success: true, job: { ...saved, _id: saved.id } };
  }

  async updateJob(companyId: string, jobId: string, data: any, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor, [
      'Owner',
      'Admin',
    ]);
    const job = await this.jobRepo.findOne({
      where: [
        { id: jobId, company_id: company.id },
        { mongoId: jobId, company_id: company.id },
      ],
    });
    if (!job) throw new NotFoundException('Job not found');

    delete data.id;
    delete data.mongoId;
    delete data.company_id;
    delete data.createdBy;
    delete data.created_by_id;

    Object.assign(job, data);
    await this.jobRepo.save(job);
    return { success: true, job: { ...job, _id: job.id } };
  }

  async deleteJob(companyId: string, jobId: string, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor, [
      'Owner',
      'Admin',
    ]);
    const job = await this.jobRepo.findOne({
      where: [
        { id: jobId, company_id: company.id },
        { mongoId: jobId, company_id: company.id },
      ],
    });
    if (!job) throw new NotFoundException('Job not found');
    await this.jobRepo.remove(job);
    return { success: true };
  }

  async getTeam(companyId: string, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor);
    const members = await this.companyUserRepo.find({
      where: { company: { id: company.id }, isActive: true },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return {
      success: true,
      team: members.map((m) => ({
        ...m,
        _id: m.id,
        user: m.user ? { ...m.user, _id: m.user.id } : null,
      })),
    };
  }

  async inviteTeamMember(companyId: string, data: any, actor: any) {
    await this.assertCompanyMembership(companyId, actor, ['Owner', 'Admin']);
    return { success: true, message: 'Invitation sent' };
  }

  async removeTeamMember(companyId: string, userId: string, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor, [
      'Owner',
      'Admin',
    ]);
    const membership = await this.companyUserRepo.findOne({
      where: [
        { company: { id: company.id }, user: { id: userId } },
        { id: userId, company: { id: company.id } },
      ],
    });
    if (membership) {
      membership.isActive = false;
      await this.companyUserRepo.save(membership);
    }
    return { success: true };
  }

  async getApplications(companyId: string, actor: any) {
    const company = await this.assertCompanyMembership(companyId, actor);
    let applications: Application[] = [];
    if (this.applicationRepo) {
      applications = await this.applicationRepo.find({
        where: { company_id: company.id },
        relations: { job: true, user: true },
        order: { createdAt: 'DESC' },
      });
    }
    return {
      success: true,
      applications: applications.map((a) => ({
        ...a,
        _id: a.id,
        job: a.job ? { ...a.job, _id: a.job.id } : null,
        user: a.user ? { ...a.user, _id: a.user.id } : null,
      })),
    };
  }

  async updateApplicationStage(
    companyId: string,
    applicationId: string,
    stage: string,
    actor: any,
  ) {
    await this.assertCompanyMembership(companyId, actor, [
      'Owner',
      'Admin',
    ]);
    if (this.applicationRepo) {
      const app = await this.applicationRepo.findOne({
        where: [
          { id: applicationId, company_id: companyId },
          { mongoId: applicationId, company_id: companyId },
        ],
      });
      if (!app) throw new NotFoundException('Application not found');
      app.stage = stage;
      await this.applicationRepo.save(app);
    }
    return { success: true };
  }

  async generateMockApplications(companyId: string, actor: any) {
    await this.assertCompanyMembership(companyId, actor, [
      'Owner',
      'Admin',
    ]);
    return { success: true, message: 'Mock applications generated' };
  }
}
