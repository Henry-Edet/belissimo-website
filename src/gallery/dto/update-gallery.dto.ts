// src/gallery/dto/update-gallery.dto.ts
import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class UpdateGalleryDto {
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsBoolean() isPublic?: boolean;
}