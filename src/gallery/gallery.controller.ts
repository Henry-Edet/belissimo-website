// src/gallery/gallery.controller.ts

import {
  Controller, Get, Post, Patch, Body, Param,
  Delete, Query, UseInterceptors, UploadedFile,
  UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GenerateSignedUrlDto, SignedUrlOperation } from './dto/signed-url.dto';
import { GalleryFolder } from './entities/gallery.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';
import { Role } from '../users/user.entity';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;  // 200MB

// Broad check — accept anything image/* or video/*
// Specific subtype validation is done below
function isAllowedMime(mime: string): boolean {
  if (!mime) return false;
  const lower = mime.toLowerCase();
  // Images
  if (/^image\/(jpeg|jpg|png|gif|webp|heic|heif)$/.test(lower)) return true;
  // Videos — iOS sends quicktime for .mov, Android sends mp4
  if (/^video\/(mp4|quicktime|mov|avi|webm|x-msvideo|3gpp|x-matroska)$/.test(lower)) return true;
  // Some devices send just 'video' or 'image' without subtype — accept and detect from filename
  if (lower === 'video' || lower === 'image') return true;
  return false;
}

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // POST /gallery/upload — admin only
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STYLIST)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_VIDEO_SIZE }, // set max at multer level (200MB)
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGalleryDto,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded. Make sure the field name is "file".');

    // Determine if video by mime or filename extension
    const mimeType = (file.mimetype ?? '').toLowerCase();
    const filename = (file.originalname ?? '').toLowerCase();
    const isVideoByExt = /\.(mp4|mov|avi|webm|mkv|3gp|m4v)$/.test(filename);
    const isVideoByMime = mimeType.startsWith('video/') || mimeType === 'video';
    const isImageByMime = mimeType.startsWith('image/') || mimeType === 'image';

    if (!isAllowedMime(mimeType) && !isVideoByExt && !isImageByMime) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not supported. ` +
        `Upload images (JPEG, PNG, WebP, HEIC) or videos (MP4, MOV, AVI, WebM).`
      );
    }

    const isVideo = isVideoByMime || isVideoByExt;
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Max size: ${isVideo ? '200MB for videos' : '10MB for images'}.`
      );
    }

    // If folder not provided default to premium_quality
    if (!dto.folder) dto.folder = GalleryFolder.PREMIUM_QUALITY;

    return this.galleryService.create(file, dto, req.user?.id);
  }

  // GET /gallery — public, paginated
  @Get()
  async findAll(
    @Query('folder') folder?: GalleryFolder,
    @Query('tags') tags?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const tagsArray = tags ? tags.split(',').map(t => t.trim()) : undefined;
    const skip = (Number(page) - 1) * Number(limit);
    return this.galleryService.findAll(folder, tagsArray, skip, Number(limit));
  }

  // GET /gallery/search
  @Get('search')
  async search(@Query('q') query: string) {
    return this.galleryService.search(query ?? '');
  }

  // GET /gallery/stats — admin only
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStats() {
    return this.galleryService.getStatistics();
  }

  // GET /gallery/folder/:folder
  @Get('folder/:folder')
  async getByFolder(@Param('folder') folder: GalleryFolder) {
    return this.galleryService.getByFolder(folder);
  }

  // GET /gallery/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  // PATCH /gallery/:id — admin only
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STYLIST)
  async update(@Param('id') id: string, @Body() dto: UpdateGalleryDto) {
    return this.galleryService.update(id, dto);
  }

  // DELETE /gallery/:id — admin only
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STYLIST)
  async remove(@Param('id') id: string) {
    await this.galleryService.remove(id);
    return { message: 'Deleted successfully' };
  }

  // POST /gallery/signed-url
  @Post('signed-url')
  @UseGuards(JwtAuthGuard)
  async generateSignedUrl(@Body() dto: GenerateSignedUrlDto) {
    const result = await this.galleryService.generateSignedUrl(
      dto.key,
      dto.operation || SignedUrlOperation.GET,
      dto.expiresIn,
    );
    return {
      signedUrl: result.signedUrl,
      expiresAt: result.expiresAt,
      key: result.key,
      operation: dto.operation || SignedUrlOperation.GET,
    };
  }
}