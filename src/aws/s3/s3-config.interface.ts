// src/aws/s3/s3-config.interface.ts
export interface S3Config {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  bucketName?: string;
  endpoint?: string; // For local development with MinIO
  s3ForcePathStyle?: boolean; // For local S3 compatible services
}