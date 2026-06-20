import { Repository } from 'typeorm';
import { GalleryItem, GalleryFolder } from './entities/gallery.entity';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { AwsService } from '../aws/aws.service';
export declare class GalleryService {
    private readonly repo;
    private readonly aws;
    private readonly logger;
    constructor(repo: Repository<GalleryItem>, aws: AwsService);
    create(file: Express.Multer.File, dto: CreateGalleryDto, uploadedBy?: number): Promise<GalleryItem>;
    findAll(folder?: GalleryFolder, tags?: string[], skip?: number, take?: number): Promise<{
        items: GalleryItem[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<GalleryItem>;
    getByFolder(folder: GalleryFolder): Promise<GalleryItem[]>;
    search(query: string): Promise<GalleryItem[]>;
    update(id: string, dto: UpdateGalleryDto): Promise<GalleryItem>;
    remove(id: string): Promise<void>;
    generateSignedUrl(key: string, operation: 'GET' | 'PUT', expiresIn?: number): Promise<{
        signedUrl: string;
        expiresAt: Date;
        key: string;
    }>;
    getStatistics(): Promise<{
        total: number;
        images: number;
        videos: number;
        totalMb: number;
        byFolder: any[];
    }>;
}
