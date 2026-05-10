// src/gallery/gallery.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { GalleryItem, GalleryFolder, GalleryItemType } from './entities/gallery.entity';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    @InjectRepository(GalleryItem)
    private readonly repo: Repository<GalleryItem>,
    private readonly aws: AwsService,
  ) {}

  // ── Upload + save ──────────────────────────────────────────────────────────
  async create(
    file: Express.Multer.File,
    dto: CreateGalleryDto,
    uploadedBy?: number,
  ): Promise<GalleryItem> {
    const folder = dto.folder ?? GalleryFolder.PREMIUM_QUALITY;

    // Upload to S3
    const { url, key } = await this.aws.uploadFile(file, folder);

    // Determine type from mimetype
    const type = file.mimetype.startsWith('video/')
      ? GalleryItemType.VIDEO
      : GalleryItemType.IMAGE;

    const item = this.repo.create({
      url,
      s3Key: key,
      type,
      folder,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      caption: dto.caption,
      tags: dto.tags,
      isPublic: dto.isPublic !== false, // default true
      uploadedBy,
    });

    return this.repo.save(item);
  }

  // ── Fetch all (paginated, filterable) ─────────────────────────────────────
  async findAll(
    folder?: GalleryFolder,
    tags?: string[],
    skip = 0,
    take = 20,
  ) {
    const qb = this.repo.createQueryBuilder('g')
      .where('g.is_public = true')
      .orderBy('g.created_at', 'DESC')
      .skip(skip)
      .take(take);

    if (folder) qb.andWhere('g.folder = :folder', { folder });
    if (tags?.length) {
      // items that contain ANY of the requested tags
      qb.andWhere('g.tags && :tags', { tags });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(id: string): Promise<GalleryItem> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Gallery item not found');
    return item;
  }

  async getByFolder(folder: GalleryFolder): Promise<GalleryItem[]> {
    return this.repo.find({
      where: { folder, isPublic: true },
      order: { createdAt: 'DESC' },
    });
  }

  async search(query: string): Promise<GalleryItem[]> {
    return this.repo.find({
      where: [
        { caption: ILike(`%${query}%`), isPublic: true },
        { originalName: ILike(`%${query}%`), isPublic: true },
      ],
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  // ── Update metadata ────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateGalleryDto): Promise<GalleryItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  // ── Delete from S3 + DB ───────────────────────────────────────────────────
  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.aws.deleteFile(item.s3Key);
    await this.repo.remove(item);
    this.logger.log(`Deleted gallery item ${id}`);
  }

  // ── Generate signed URL for private items ─────────────────────────────────
  async generateSignedUrl(
    key: string,
    operation: 'GET' | 'PUT',
    expiresIn = 3600,
  ) {
    const signedUrl = await this.aws.generateSignedUrl(key, expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    return { signedUrl, expiresAt, key };
  }

  // ── Stats for admin ────────────────────────────────────────────────────────
  async getStatistics() {
    const total = await this.repo.count();
    const images = await this.repo.count({ where: { type: GalleryItemType.IMAGE } });
    const videos = await this.repo.count({ where: { type: GalleryItemType.VIDEO } });

    const byFolder = await this.repo.createQueryBuilder('g')
      .select('g.folder', 'folder')
      .addSelect('COUNT(*)', 'count')
      .groupBy('g.folder')
      .getRawMany();

    const sizeResult = await this.repo.createQueryBuilder('g')
      .select('SUM(g.file_size)', 'totalBytes')
      .getRawOne();

    const totalMb = Math.round((sizeResult?.totalBytes ?? 0) / 1024 / 1024);

    return { total, images, videos, totalMb, byFolder };
  }
}