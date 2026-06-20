import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GenerateSignedUrlDto, SignedUrlOperation } from './dto/signed-url.dto';
import { GalleryFolder } from './entities/gallery.entity';
export declare class GalleryController {
    private readonly galleryService;
    constructor(galleryService: GalleryService);
    upload(file: Express.Multer.File, dto: CreateGalleryDto, req: any): Promise<import("./entities/gallery.entity").GalleryItem>;
    findAll(folder?: GalleryFolder, tags?: string, page?: number, limit?: number): Promise<{
        items: import("./entities/gallery.entity").GalleryItem[];
        total: number;
        page: number;
        limit: number;
    }>;
    search(query: string): Promise<import("./entities/gallery.entity").GalleryItem[]>;
    getStats(): Promise<{
        total: number;
        images: number;
        videos: number;
        totalMb: number;
        byFolder: any[];
    }>;
    getByFolder(folder: GalleryFolder): Promise<import("./entities/gallery.entity").GalleryItem[]>;
    findOne(id: string): Promise<import("./entities/gallery.entity").GalleryItem>;
    update(id: string, dto: UpdateGalleryDto): Promise<import("./entities/gallery.entity").GalleryItem>;
    remove(id: string): Promise<{
        message: string;
    }>;
    generateSignedUrl(dto: GenerateSignedUrlDto): Promise<{
        signedUrl: string;
        expiresAt: Date;
        key: string;
        operation: SignedUrlOperation;
    }>;
}
