export declare class UploadResponseDto {
    url: string;
    key: string;
    etag: string;
    originalName?: string;
}
export declare class BulkUploadResponseDto {
    files: UploadResponseDto[];
    total: number;
    folder: string;
}
