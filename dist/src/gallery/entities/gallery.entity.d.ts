export declare enum GalleryItemType {
    IMAGE = "image",
    VIDEO = "video"
}
export declare enum GalleryFolder {
    PREMIUM_QUALITY = "premium_quality",
    QUICK_SERVICE = "quick_service",
    EXPERT_STYLISTS = "expert_stylists",
    HYGIENE_FIRST = "hygiene_first"
}
export declare const FOLDER_LABELS: Record<GalleryFolder, string>;
export declare class GalleryItem {
    id: string;
    url: string;
    s3Key: string;
    thumbnailUrl?: string;
    type: GalleryItemType;
    folder: GalleryFolder;
    originalName: string;
    mimeType: string;
    fileSize: number;
    caption?: string;
    tags?: string[];
    isPublic: boolean;
    uploadedBy?: number;
    createdAt: Date;
    updatedAt: Date;
}
