export interface S3Config {
    accessKeyId?: string;
    secretAccessKey?: string;
    region: string;
    bucketName?: string;
    endpoint?: string;
    s3ForcePathStyle?: boolean;
}
