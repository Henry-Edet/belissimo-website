// src/gallery/dto/create-gallery.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';

export enum GalleryFolder {
  SERVICES = 'services',
  GALLERY = 'gallery',
  PORTFOLIO = 'portfolio',
  AVATARS = 'avatars',
  TEMP = 'temp',
}

export class CreateGalleryDto {
  @ApiPropertyOptional({ description: 'Folder/category for the file', enum: GalleryFolder, default: GalleryFolder.GALLERY })
  @IsOptional()
  @IsEnum(GalleryFolder)
  folder?: GalleryFolder;

  @ApiPropertyOptional({ description: 'Description/alt text for the image' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the file is public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CreateGalleryResponseDto {
  @ApiProperty({ description: 'Gallery record ID' })
  id: string;

  @ApiProperty({ description: 'Public URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'S3 key/path' })
  s3Key: string;

  @ApiProperty({ description: 'Original filename' })
  originalName: string;
}