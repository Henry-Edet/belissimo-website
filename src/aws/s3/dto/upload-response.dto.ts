// src/aws/s3/dto/upload-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Public URL of the uploaded file',
    example: 'https://bucket.s3.region.amazonaws.com/uploads/filename.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'S3 key/path of the uploaded file',
    example: 'uploads/filename-1234567890-abc123def456.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'ETag of the uploaded file',
    example: '"abc123def456ghi789"',
  })
  etag: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'profile.jpg',
    required: false,
  })
  originalName?: string;
}

export class BulkUploadResponseDto {
  @ApiProperty({
    type: [UploadResponseDto],
    description: 'Array of uploaded files',
  })
  files: UploadResponseDto[];

  @ApiProperty({
    description: 'Total number of successfully uploaded files',
    example: 3,
  })
  total: number;

  @ApiProperty({
    description: 'Folder where files were uploaded',
    example: 'gallery',
  })
  folder: string;
}