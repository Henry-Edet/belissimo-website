// src/services/services.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';
import { Role } from '../users/user.entity';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ── GET /services ── public ───────────────────────────────────────────────
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  // ── GET /services/:id ─────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  // ── POST /services ── admin creates a new service ─────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() body: {
      name: string;
      priceCents: string;
      durationMinutes: string;
      description?: string;
      tag?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.servicesService.createService({
      name: body.name,
      priceCents: parseInt(body.priceCents, 10),
      durationMinutes: parseInt(body.durationMinutes, 10),
      description: body.description,
      tag: body.tag,
      imageFile: file,
    });
  }

  // ── PATCH /services/:id ── admin updates price, name, duration, etc ───────
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      priceCents?: string;
      durationMinutes?: string;
      description?: string;
      tag?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.servicesService.updateService(id, {
      name: body.name,
      priceCents: body.priceCents ? parseInt(body.priceCents, 10) : undefined,
      durationMinutes: body.durationMinutes ? parseInt(body.durationMinutes, 10) : undefined,
      description: body.description,
      tag: body.tag,
      imageFile: file,
    });
  }

  // ── DELETE /services/:id ── admin removes a service ───────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.servicesService.deleteService(id);
  }
}