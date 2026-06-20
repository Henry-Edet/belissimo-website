"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GalleryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gallery_entity_1 = require("./entities/gallery.entity");
const aws_service_1 = require("../aws/aws.service");
let GalleryService = GalleryService_1 = class GalleryService {
    constructor(repo, aws) {
        this.repo = repo;
        this.aws = aws;
        this.logger = new common_1.Logger(GalleryService_1.name);
    }
    async create(file, dto, uploadedBy) {
        const folder = dto.folder ?? gallery_entity_1.GalleryFolder.PREMIUM_QUALITY;
        const { url, key } = await this.aws.uploadFile(file, folder);
        const type = file.mimetype.startsWith('video/')
            ? gallery_entity_1.GalleryItemType.VIDEO
            : gallery_entity_1.GalleryItemType.IMAGE;
        const item = this.repo.create({
            url,
            s3Key: key,
            type,
            folder,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            caption: dto.caption,
            tags: dto.tags,
            isPublic: dto.isPublic !== false,
            uploadedBy,
        });
        return this.repo.save(item);
    }
    async findAll(folder, tags, skip = 0, take = 20) {
        const qb = this.repo.createQueryBuilder('g')
            .where('g.is_public = true')
            .orderBy('g.created_at', 'DESC')
            .skip(skip)
            .take(take);
        if (folder)
            qb.andWhere('g.folder = :folder', { folder });
        if (tags?.length) {
            qb.andWhere('g.tags && :tags', { tags });
        }
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page: Math.floor(skip / take) + 1, limit: take };
    }
    async findOne(id) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Gallery item not found');
        return item;
    }
    async getByFolder(folder) {
        return this.repo.find({
            where: { folder, isPublic: true },
            order: { createdAt: 'DESC' },
        });
    }
    async search(query) {
        return this.repo.find({
            where: [
                { caption: (0, typeorm_2.ILike)(`%${query}%`), isPublic: true },
                { originalName: (0, typeorm_2.ILike)(`%${query}%`), isPublic: true },
            ],
            order: { createdAt: 'DESC' },
            take: 30,
        });
    }
    async update(id, dto) {
        const item = await this.findOne(id);
        Object.assign(item, dto);
        return this.repo.save(item);
    }
    async remove(id) {
        const item = await this.findOne(id);
        await this.aws.deleteFile(item.s3Key);
        await this.repo.remove(item);
        this.logger.log(`Deleted gallery item ${id}`);
    }
    async generateSignedUrl(key, operation, expiresIn = 3600) {
        const signedUrl = await this.aws.generateSignedUrl(key, expiresIn);
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        return { signedUrl, expiresAt, key };
    }
    async getStatistics() {
        const total = await this.repo.count();
        const images = await this.repo.count({ where: { type: gallery_entity_1.GalleryItemType.IMAGE } });
        const videos = await this.repo.count({ where: { type: gallery_entity_1.GalleryItemType.VIDEO } });
        const byFolder = await this.repo.createQueryBuilder('g')
            .select('g.folder', 'folder')
            .addSelect('COUNT(*)', 'count')
            .groupBy('g.folder')
            .getRawMany();
        const sizeResult = await this.repo.createQueryBuilder('g')
            .select('SUM(g.file_size)', 'totalBytes')
            .getRawOne();
        const totalMb = Math.round((sizeResult?.totalBytes ?? 0) / 1024 / 1024);
        return { total, images, videos, totalMb, byFolder };
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = GalleryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gallery_entity_1.GalleryItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        aws_service_1.AwsService])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map