import { ConfigService } from '@nestjs/config';
export declare class AwsService {
    private readonly config;
    private readonly logger;
    private readonly s3;
    private readonly bucket;
    private readonly region;
    constructor(config: ConfigService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        key: string;
    }>;
    deleteFile(key: string): Promise<void>;
    generateSignedUrl(key: string, expiresIn?: number): Promise<string>;
    getBucketUrl(): string;
}
