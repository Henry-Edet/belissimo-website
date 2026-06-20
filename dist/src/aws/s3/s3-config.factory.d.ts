import { ConfigService } from '@nestjs/config';
export declare class S3Config {
    private configService;
    private readonly logger;
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly region: string;
    readonly bucketName: string;
    readonly endpoint?: string;
    readonly s3ForcePathStyle: boolean;
    constructor(configService: ConfigService);
    private getRequired;
    get baseUrl(): string;
}
