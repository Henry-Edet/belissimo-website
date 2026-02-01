// src/gallery/dto/update-gallery.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateGalleryDto } from './create-gallery.dto';

export class UpdateGalleryDto extends PartialType(CreateGalleryDto) {}