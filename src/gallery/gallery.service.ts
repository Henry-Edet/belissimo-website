// src/gallery/gallery.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gallery } from './entities/gallery.entity';
import { CreateGalleryDto, GalleryFolder } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { S3Service } from '../aws/s3/s3.service';
import sharp from 'sharp';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,
    private s3Service: S3Service,
  ) {}

  async create(
    file: Express.Multer.File,
    createGalleryDto: CreateGalleryDto,
    userId?: string,
  ): Promise<Gallery> {
    try {
      // Process image if it's an image
      let processedBuffer = file.buffer;
      let width: number | null = null;
      let height: number | null = null;

      if (file.mimetype.startsWith('image/')) {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        
        width = metadata.width || null;
        height = metadata.height || null;

        // Optimize image: resize if too large and convert to webp for better compression
        if (width && width > 1920) {
          processedBuffer = await image
            .resize(1920, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
        }
      }

      // Upload to S3
      const uploadResult = await this.s3Service.uploadFile(
        processedBuffer,
        file.originalname,
        createGalleryDto.folder || GalleryFolder.GALLERY,
        file.mimetype,
      );

      // Create gallery record
      const gallery = this.galleryRepository.create({
        s3Key: uploadResult.key,
        url: uploadResult.url,
        originalName: file.originalname,
        fileSize: processedBuffer.length,
        mimeType: file.mimetype,
        folder: createGalleryDto.folder || GalleryFolder.GALLERY,
        description: createGalleryDto.description,
        tags: createGalleryDto.tags,
        isPublic: createGalleryDto.isPublic ?? true,
        uploadedBy: userId,
        width,
        height,
      } as Gallery); // Add "as Gallery" here

      return await this.galleryRepository.save(gallery);
    } catch (error) {
      this.logger.error(`Failed to create gallery item: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async findAll(
    folder?: GalleryFolder,
    tags?: string[],
    skip = 0,
    take = 20,
  ): Promise<{ items: Gallery[]; total: number }> {
    const query = this.galleryRepository.createQueryBuilder('gallery');

    if (folder) {
      query.andWhere('gallery.folder = :folder', { folder });
    }

    if (tags && tags.length > 0) {
      query.andWhere('gallery.tags && :tags', { tags });
    }

    query.orderBy('gallery.createdAt', 'DESC');
    
    const [items, total] = await query
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Gallery> {
    const gallery = await this.galleryRepository.findOne({ where: { id } });
    
    if (!gallery) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    return gallery;
  }

  async update(id: string, updateGalleryDto: UpdateGalleryDto): Promise<Gallery> {
    const gallery = await this.findOne(id);
    
    Object.assign(gallery, updateGalleryDto);
    gallery.updatedAt = new Date();
    
    return await this.galleryRepository.save(gallery);
  }

  async remove(id: string): Promise<void> {
    const gallery = await this.findOne(id);
    
    try {
      // Delete from S3
      await this.s3Service.deleteFile(gallery.s3Key);
      
      // Delete from database
      await this.galleryRepository.remove(gallery);
    } catch (error) {
      this.logger.error(`Failed to delete gallery item ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async generateSignedUrl(key: string, operation: 'getObject' | 'putObject' = 'getObject', expiresIn = 3600): Promise<{
    signedUrl: string;
    expiresAt: Date;
    key: string;
  }> {
    const gallery = await this.galleryRepository.findOne({ where: { s3Key: key } });
    
    if (!gallery) {
      throw new NotFoundException(`File with key ${key} not found`);
    }

    if (gallery.isPublic && operation === 'getObject') {
      throw new BadRequestException('File is public, no signed URL needed');
    }

    const signedUrl = await this.s3Service.getSignedUrl(key, expiresIn, operation);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      signedUrl,
      expiresAt,
      key,
    };
  }

  async getByFolder(folder: GalleryFolder): Promise<Gallery[]> {
    return await this.galleryRepository.find({
      where: { folder },
      order: { createdAt: 'DESC' },
    });
  }

  async search(query: string): Promise<Gallery[]> {
    return await this.galleryRepository
      .createQueryBuilder('gallery')
      .where('gallery.originalName ILIKE :query', { query: `%${query}%` })
      .orWhere('gallery.description ILIKE :query', { query: `%${query}%` })
      .orWhere('gallery.tags::text ILIKE :query', { query: `%${query}%` })
      .orderBy('gallery.createdAt', 'DESC')
      .getMany();
  }

  async getStatistics(): Promise<{
    total: number;
    byFolder: Record<string, number>;
    totalSize: number;
  }> {
    const total = await this.galleryRepository.count();
    
    const byFolder = await this.galleryRepository
      .createQueryBuilder('gallery')
      .select('gallery.folder, COUNT(*) as count')
      .groupBy('gallery.folder')
      .getRawMany();

    const totalSizeResult = await this.galleryRepository
      .createQueryBuilder('gallery')
      .select('SUM(gallery.fileSize)', 'totalSize')
      .getRawOne();

    const folderStats: Record<string, number> = {};
    byFolder.forEach(item => {
      folderStats[item.folder] = parseInt(item.count);
    });

    return {
      total,
      byFolder: folderStats,
      totalSize: parseInt(totalSizeResult.totalSize) || 0,
    };
  }
}