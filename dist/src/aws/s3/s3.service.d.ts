import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
export declare class S3Service {
    private configService;
    private readonly logger;
    private s3;
    private bucketName;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    uploadFile(file: Buffer, fileName: string, folder?: string, contentType?: string): Promise<{
        url: string;
        key: string;
        etag: string;
    }>;
    deleteFile(key: string): Promise<boolean>;
    fileExists(key: string): Promise<boolean>;
    getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput>;
    listFiles(prefix?: string, maxKeys?: number): Promise<AWS.S3.ObjectList>;
    getSignedUrl(key: string, expiresIn?: number, operation?: 'getObject' | 'putObject'): Promise<string>;
    private generateUniqueFileName;
    private getContentType;
}
