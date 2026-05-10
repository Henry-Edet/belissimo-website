// src/gallery/gallery.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum GalleryItemType {
  IMAGE = 'image',
  VIDEO = 'video',
}

// These match the 4 sections shown to clients in the gallery
export enum GalleryFolder {
  PREMIUM_QUALITY  = 'premium_quality',
  QUICK_SERVICE    = 'quick_service',
  EXPERT_STYLISTS  = 'expert_stylists',
  HYGIENE_FIRST    = 'hygiene_first',
}

// Display labels shown in the UI
export const FOLDER_LABELS: Record<GalleryFolder, string> = {
  [GalleryFolder.PREMIUM_QUALITY]: 'Premium Quality',
  [GalleryFolder.QUICK_SERVICE]:   'Quick Service',
  [GalleryFolder.EXPERT_STYLISTS]: 'Expert Stylists',
  [GalleryFolder.HYGIENE_FIRST]:   'Hygiene First',
};

@Entity('gallery_item')
export class GalleryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({ name: 's3_key', type: 'text' })
  s3Key!: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'enum', enum: GalleryItemType, default: GalleryItemType.IMAGE })
  type!: GalleryItemType;

  @Column({ type: 'enum', enum: GalleryFolder, default: GalleryFolder.PREMIUM_QUALITY })
  folder!: GalleryFolder;

  @Column({ name: 'original_name', type: 'text' })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize!: number;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ name: 'is_public', default: true })
  isPublic!: boolean;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}