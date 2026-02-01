// src/aws/s3/s3.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import { S3Config } from './s3-config.interface';
import { PutObjectRequest, GetObjectRequest, DeleteObjectRequest } from 'aws-sdk/clients/s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3: AWS.S3;
  private bucketName: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Get values with fallbacks
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const s3ForcePathStyle = this.configService.get<boolean>('AWS_S3_FORCE_PATH_STYLE', false);

    // Validate required config
    if (!accessKeyId || !secretAccessKey || !bucketName) {
      this.logger.warn('AWS S3 configuration is incomplete. Some features may not work.');
    }

    // Initialize S3 client (will work even with empty strings for local dev)
    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region,
      endpoint,
      s3ForcePathStyle,
      signatureVersion: 'v4',
    });

    // Store bucket name - guaranteed to be string (empty string if missing)
    this.bucketName = bucketName;
    
    // Construct base URL only if bucketName is not empty
    if (bucketName) {
      if (endpoint) {
        this.baseUrl = `${endpoint}/${bucketName}`;
      } else {
        this.baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;
      }
    } else {
      this.baseUrl = ''; // Empty string if no bucket configured
    }
  }

  /**
   * Upload a file to S3
   */
  // In uploadFile method:
async uploadFile(
  file: Buffer,
  fileName: string,
  folder: string = 'uploads',
  contentType?: string,
): Promise<{ url: string; key: string; etag: string }> {
  try {
    // Check if S3 is configured
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured. Please check AWS_S3_BUCKET_NAME in environment variables.');
    }

    // Generate unique filename to prevent collisions
    const uniqueFileName = this.generateUniqueFileName(fileName);
    const key = `${folder}/${uniqueFileName}`;

    const params: PutObjectRequest = {
      Bucket: this.bucketName, // Now definitely a string
      Key: key,
      Body: file,
      ContentType: contentType || this.getContentType(fileName),
      ACL: 'public-read',
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    };

    const result = await this.s3.upload(params).promise();
    
    return {
      url: `${this.baseUrl}/${key}`,
      key: result.Key,
      etag: result.ETag,
    };
  } catch (error) {
    this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

// In deleteFile method:
async deleteFile(key: string): Promise<boolean> {
  try {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const params: DeleteObjectRequest = {
      Bucket: this.bucketName, // Now definitely a string
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
    this.logger.log(`Successfully deleted file: ${key}`);
    return true;
  } catch (error) {
    this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
    throw new Error(`S3 delete failed: ${error.message}`);
  }
}

// In fileExists method:
async fileExists(key: string): Promise<boolean> {
  try {
    if (!this.bucketName) {
      return false;
    }

    const params: GetObjectRequest = {
      Bucket: this.bucketName, // Now definitely a string
      Key: key,
    };

    await this.s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params: GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      return await this.s3.headObject(params).promise();
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${error.message}`, error.stack);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List files in a folder/prefix
   */
  async listFiles(prefix: string = '', maxKeys: number = 100): Promise<AWS.S3.ObjectList> {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`, error.stack);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Add this method to your S3Service class
async getSignedUrl(
  key: string,
  expiresIn: number = 3600,
  operation: 'getObject' | 'putObject' = 'getObject',
): Promise<string> {
  try {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn,
    };

    if (operation === 'getObject') {
      return this.s3.getSignedUrlPromise('getObject', params);
    } else {
      return this.s3.getSignedUrlPromise('putObject', params);
    }
  } catch (error) {
    this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

  /**
   * Generate a unique filename with timestamp and random string
   */
  private generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  
  // Split filename and extension
  const lastDotIndex = originalName.lastIndexOf('.');
  let nameWithoutExtension = originalName;
  let extension = '';
  
  if (lastDotIndex !== -1) {
    nameWithoutExtension = originalName.substring(0, lastDotIndex);
    extension = originalName.substring(lastDotIndex + 1);
  }
  
  // Clean filename: remove special characters and spaces
  const cleanName = nameWithoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (extension) {
    return `${cleanName}-${timestamp}-${randomString}.${extension}`;
  } else {
    return `${cleanName}-${timestamp}-${randomString}`;
  }
}

  /**
   * Determine content type from file extension
   */
  // In the getContentType method:
  private getContentType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    // Check if extension exists
    if (!extension) {
      return 'application/octet-stream';
    }
    
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      
      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      
      // Audio/Video
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
      mpeg: 'video/mpeg',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wav: 'audio/wav',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}