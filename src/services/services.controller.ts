import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  getAll(): Promise<Service[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<Service> {
    return this.servicesService.findOne(Number(id));
  }

  @Post()
  create(@Body() data: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateServiceDto,
  ): Promise<Service> {
    return this.servicesService.update(Number(id), data);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.servicesService.remove(Number(id));
  }
}
