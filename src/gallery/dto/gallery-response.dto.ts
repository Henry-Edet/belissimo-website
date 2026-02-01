// src/gallery/dto/gallery-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Gallery } from '../entities/gallery.entity';

export class GalleryResponseDto extends Gallery {}