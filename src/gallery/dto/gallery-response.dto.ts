// src/gallery/dto/gallery-response.dto.ts
export class GalleryResponseDto {
  id!: string;
  url!: string;
  thumbnailUrl?: string;
  type!: string;
  folder!: string;
  originalName!: string;
  caption?: string;
  tags?: string[];
  fileSize!: number;
  isPublic!: boolean;
  createdAt!: Date;
}