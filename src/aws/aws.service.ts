// src/aws/aws.service.ts
// Handles all S3 operations — upload, delete, signed URLs

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION') ?? 'eu-central-1';
    this.bucket = this.config.get<string>('AWS_S3_BUCKET_NAME') ?? this.config.get<string>('AWS_S3_BUCKET') ?? 'bellissimo-gallery';

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  // ── Upload a file buffer to S3 ─────────────────────────────────────────────
  async uploadFile(
    file: Express.Multer.File,
    folder = 'gallery',
  ): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const key = `${folder}/${uniqueName}`;

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // No ACL — bucket policy handles public read access
      },
    });

    await upload.done();

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    this.logger.log(`Uploaded: ${key}`);
    return { url, key };
  }

  // ── Delete a file from S3 ──────────────────────────────────────────────────
  async deleteFile(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Deleted: ${key}`);
  }

  // ── Generate a signed URL for temporary private access ────────────────────
  async generateSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  getBucketUrl(): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }
}