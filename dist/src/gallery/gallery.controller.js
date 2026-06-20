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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const gallery_service_1 = require("./gallery.service");
const create_gallery_dto_1 = require("./dto/create-gallery.dto");
const update_gallery_dto_1 = require("./dto/update-gallery.dto");
const signed_url_dto_1 = require("./dto/signed-url.dto");
const gallery_entity_1 = require("./entities/gallery.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const role_decorator_1 = require("../auth/role.decorator");
const user_entity_1 = require("../users/user.entity");
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
function isAllowedMime(mime) {
    if (!mime)
        return false;
    const lower = mime.toLowerCase();
    if (/^image\/(jpeg|jpg|png|gif|webp|heic|heif)$/.test(lower))
        return true;
    if (/^video\/(mp4|quicktime|mov|avi|webm|x-msvideo|3gpp|x-matroska)$/.test(lower))
        return true;
    if (lower === 'video' || lower === 'image')
        return true;
    return false;
}
let GalleryController = class GalleryController {
    constructor(galleryService) {
        this.galleryService = galleryService;
    }
    async upload(file, dto, req) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded. Make sure the field name is "file".');
        const mimeType = (file.mimetype ?? '').toLowerCase();
        const filename = (file.originalname ?? '').toLowerCase();
        const isVideoByExt = /\.(mp4|mov|avi|webm|mkv|3gp|m4v)$/.test(filename);
        const isVideoByMime = mimeType.startsWith('video/') || mimeType === 'video';
        const isImageByMime = mimeType.startsWith('image/') || mimeType === 'image';
        if (!isAllowedMime(mimeType) && !isVideoByExt && !isImageByMime) {
            throw new common_1.BadRequestException(`File type "${file.mimetype}" is not supported. ` +
                `Upload images (JPEG, PNG, WebP, HEIC) or videos (MP4, MOV, AVI, WebM).`);
        }
        const isVideo = isVideoByMime || isVideoByExt;
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`File too large. Max size: ${isVideo ? '200MB for videos' : '10MB for images'}.`);
        }
        if (!dto.folder)
            dto.folder = gallery_entity_1.GalleryFolder.PREMIUM_QUALITY;
        return this.galleryService.create(file, dto, req.user?.id);
    }
    async findAll(folder, tags, page = 1, limit = 20) {
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : undefined;
        const skip = (Number(page) - 1) * Number(limit);
        return this.galleryService.findAll(folder, tagsArray, skip, Number(limit));
    }
    async search(query) {
        return this.galleryService.search(query ?? '');
    }
    async getStats() {
        return this.galleryService.getStatistics();
    }
    async getByFolder(folder) {
        return this.galleryService.getByFolder(folder);
    }
    async findOne(id) {
        return this.galleryService.findOne(id);
    }
    async update(id, dto) {
        return this.galleryService.update(id, dto);
    }
    async remove(id) {
        await this.galleryService.remove(id);
        return { message: 'Deleted successfully' };
    }
    async generateSignedUrl(dto) {
        const result = await this.galleryService.generateSignedUrl(dto.key, dto.operation || signed_url_dto_1.SignedUrlOperation.GET, dto.expiresIn);
        return {
            signedUrl: result.signedUrl,
            expiresAt: result.expiresAt,
            key: result.key,
            operation: dto.operation || signed_url_dto_1.SignedUrlOperation.GET,
        };
    }
};
exports.GalleryController = GalleryController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN, user_entity_1.Role.STYLIST),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_VIDEO_SIZE },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_gallery_dto_1.CreateGalleryDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('folder')),
    __param(1, (0, common_1.Query)('tags')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('folder/:folder'),
    __param(0, (0, common_1.Param)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "getByFolder", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN, user_entity_1.Role.STYLIST),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_gallery_dto_1.UpdateGalleryDto]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN, user_entity_1.Role.STYLIST),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('signed-url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signed_url_dto_1.GenerateSignedUrlDto]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "generateSignedUrl", null);
exports.GalleryController = GalleryController = __decorate([
    (0, common_1.Controller)('gallery'),
    __metadata("design:paramtypes", [gallery_service_1.GalleryService])
], GalleryController);
//# sourceMappingURL=gallery.controller.js.map