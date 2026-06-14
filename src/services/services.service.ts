// src/services/services.service.ts
// ADD these methods to your existing services.service.ts — do not replace the whole file
// Just paste the 3 new methods (createService, updateService, deleteService) inside the class
// and add the AwsService injection to the constructor

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly awsService: AwsService, // add this to your existing constructor
  ) {}

  // ── Already exists in your file ──────────────────────────────────────────
  async findAll(): Promise<Service[]> {
    return this.serviceRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  // ── NEW: Create a service ─────────────────────────────────────────────────
  async createService(dto: {
    name: string;
    priceCents: number;
    durationMinutes: number;
    description?: string;
    tag?: string;
    imageFile?: Express.Multer.File;
  }): Promise<Service> {
    let imageUrl: string | undefined;

    if (dto.imageFile) {
      // Upload to S3 under the 'services' folder
      const uploaded = await this.awsService.uploadFile(dto.imageFile, 'services');
      imageUrl = uploaded.url;
    }

    const service = this.serviceRepo.create({
      name: dto.name,
      priceCents: dto.priceCents,
      durationMinutes: dto.durationMinutes,
      description: dto.description,
      tag: dto.tag,
      imageUrl,
    });

    return this.serviceRepo.save(service);
  }

  // ── NEW: Update price, name, duration, description, image ─────────────────
  async updateService(id: string, dto: {
    name?: string;
    priceCents?: number;
    durationMinutes?: number;
    description?: string;
    tag?: string;
    imageFile?: Express.Multer.File;
  }): Promise<Service> {
    const service = await this.findOne(id);

    if (dto.name !== undefined) service.name = dto.name;
    if (dto.priceCents !== undefined) service.priceCents = dto.priceCents;
    if (dto.durationMinutes !== undefined) service.durationMinutes = dto.durationMinutes;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.tag !== undefined) service.tag = dto.tag;

    if (dto.imageFile) {
      const uploaded = await this.awsService.uploadFile(dto.imageFile, 'services');
      service.imageUrl = uploaded.url;
    }

    return this.serviceRepo.save(service);
  }

  // ── NEW: Delete a service ─────────────────────────────────────────────────
  async deleteService(id: string): Promise<{ message: string }> {
    const service = await this.findOne(id);
    await this.serviceRepo.remove(service);
    return { message: `Service "${service.name}" deleted` };
  }
}