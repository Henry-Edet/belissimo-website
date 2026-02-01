// src/gallery/entities/gallery.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('galleries')
export class Gallery {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'S3 key/path of the file' })
  @Column()
  s3Key: string;

  @ApiProperty({ description: 'Public URL of the file' })
  @Column()
  url: string;

  @ApiProperty({ description: 'Original filename' })
  @Column()
  originalName: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column('int')
  fileSize: number;

  @ApiProperty({ description: 'MIME type of the file' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'Folder/category of the file' })
  @Column({ default: 'general' })
  folder: string;

  @ApiProperty({ description: 'Description/alt text for the image' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Tags for categorization' })
  @Column('simple-array', { nullable: true })
  tags: string[];

  @ApiProperty({ description: 'Width in pixels (for images)' })
  @Column('int', { nullable: true })
  width: number;

  @ApiProperty({ description: 'Height in pixels (for images)' })
  @Column('int', { nullable: true })
  height: number;

  @ApiProperty({ description: 'Whether the file is public or requires signed URLs' })
  @Column({ default: true })
  isPublic: boolean;

  @ApiProperty({ description: 'Uploaded by user ID' })
  @Column({ nullable: true })
  uploadedBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}