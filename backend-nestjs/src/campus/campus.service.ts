import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from '../database/entities/university.entity';
import { UniversityUser } from '../database/entities/university-user.entity';

@Injectable()
export class CampusService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>,
    @InjectRepository(UniversityUser)
    private readonly universityUserRepo: Repository<UniversityUser>,
  ) {}

  async getUniversities() {
    const list = await this.universityRepo.find({
      where: { isVerified: true },
      order: { createdAt: 'DESC' },
    });
    return list.map((u) => ({ ...u, _id: u.id }));
  }

  async getUniversityProfile(username: string) {
    const university = await this.universityRepo.findOne({
      where: { username, isVerified: true },
    });
    if (!university) throw new NotFoundException('University not found');
    return { ...university, _id: university.id };
  }

  async registerUniversity(userId: string, data: any) {
    const { name, username, domain, website } = data;
    const existingUniversity = await this.universityRepo.findOne({
      where: { username: username.toLowerCase() },
    });
    if (existingUniversity) {
      throw new BadRequestException('University username already exists');
    }

    const university = this.universityRepo.create({
      name,
      username: username.toLowerCase(),
      domain: domain || '',
      website: website || '',
      createdBy: { id: userId } as any,
    });
    await this.universityRepo.save(university);

    const membership = this.universityUserRepo.create({
      university: { id: university.id } as any,
      user: { id: userId } as any,
      role: 'Admin',
      isActive: true,
    });
    await this.universityUserRepo.save(membership);

    return { success: true, university: { ...university, _id: university.id } };
  }

  async getMyUniversities(userId: string) {
    const memberships = await this.universityUserRepo.find({
      where: { user: { id: userId }, isActive: true },
      relations: { university: true },
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      universities: memberships.map((m) => ({
        ...m,
        _id: m.id,
        university: m.university ? { ...m.university, _id: m.university.id } : null,
      })),
    };
  }

  async getUniversityById(universityId: string) {
    const university = await this.universityRepo.findOne({
      where: [{ id: universityId }, { mongoId: universityId }],
    });
    if (!university) {
      throw new NotFoundException('University not found');
    }
    return { success: true, university: { ...university, _id: university.id } };
  }

  async updateUniversity(
    universityId: string,
    updates: any,
    actor?: { id?: string; role?: string; isAdmin?: boolean },
  ) {
    const university = await this.universityRepo.findOne({
      where: [{ id: universityId }, { mongoId: universityId }],
    });
    if (!university) throw new NotFoundException('University not found');

    if (actor) {
      const isPlatformAdmin =
        actor.isAdmin ||
        ['admin', 'super_admin', 'campus_admin'].includes(actor.role || '');

      if (!isPlatformAdmin) {
        const membership = await this.universityUserRepo.findOne({
          where: {
            university: { id: university.id },
            user: { id: actor.id },
            isActive: true,
          },
        });
        if (!membership || !['Admin', 'Owner'].includes(membership.role)) {
          throw new ForbiddenException(
            'You do not have management permissions for this university',
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

    Object.assign(university, updates);
    await this.universityRepo.save(university);
    return { success: true, university: { ...university, _id: university.id } };
  }
}
