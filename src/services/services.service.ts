import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async findAll(): Promise<Service[]> {
    return this.serviceRepo.find();
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id: String(id) } });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async create(data: CreateServiceDto): Promise<Service> {
    const newService = this.serviceRepo.create(data);
    return this.serviceRepo.save(newService);
  }

  async update(id: number, data: UpdateServiceDto): Promise<Service> {
    const exists = await this.serviceRepo.findOne({ where: { id: String(id) } });

    if (!exists) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    await this.serviceRepo.update(String(id), data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.serviceRepo.findOne({ where: { id: String(id) } });

    if (!exists) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    await this.serviceRepo.delete(String(id));
  }
}
