// src/gallery/dto/create-gallery.dto.ts
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { GalleryFolder } from '../entities/gallery.entity';

export { GalleryFolder };

export class CreateGalleryDto {
  @IsOptional()
  @IsEnum(GalleryFolder)
  folder?: GalleryFolder;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((t: string) => t.trim()) : value
  )
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic?: boolean;
}