import { GalleryFolder } from '../entities/gallery.entity';
export { GalleryFolder };
export declare class CreateGalleryDto {
    folder?: GalleryFolder;
    caption?: string;
    tags?: string[];
    isPublic?: boolean;
}
