// src/aws/s3/s3-config.factory.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Config {
  private readonly logger = new Logger(S3Config.name);
  
  public readonly accessKeyId: string;
  public readonly secretAccessKey: string;
  public readonly region: string;
  public readonly bucketName: string;
  public readonly endpoint?: string;
  public readonly s3ForcePathStyle: boolean;

  constructor(private configService: ConfigService) {
    this.accessKeyId = this.getRequired('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.getRequired('AWS_SECRET_ACCESS_KEY');
    this.bucketName = this.getRequired('AWS_S3_BUCKET_NAME');
    this.region = configService.get<string>('AWS_REGION') || 'us-east-1';
    this.endpoint = configService.get<string>('AWS_S3_ENDPOINT');
    this.s3ForcePathStyle = configService.get<boolean>('AWS_S3_FORCE_PATH_STYLE', false);
  }

  private getRequired(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      const message = `Missing required S3 configuration: ${key}`;
      this.logger.error(message);
      throw new Error(message);
    }
    return value;
  }

  get baseUrl(): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucketName}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
  }
}