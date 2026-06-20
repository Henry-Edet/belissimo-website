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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryItem = exports.FOLDER_LABELS = exports.GalleryFolder = exports.GalleryItemType = void 0;
const typeorm_1 = require("typeorm");
var GalleryItemType;
(function (GalleryItemType) {
    GalleryItemType["IMAGE"] = "image";
    GalleryItemType["VIDEO"] = "video";
})(GalleryItemType || (exports.GalleryItemType = GalleryItemType = {}));
var GalleryFolder;
(function (GalleryFolder) {
    GalleryFolder["PREMIUM_QUALITY"] = "premium_quality";
    GalleryFolder["QUICK_SERVICE"] = "quick_service";
    GalleryFolder["EXPERT_STYLISTS"] = "expert_stylists";
    GalleryFolder["HYGIENE_FIRST"] = "hygiene_first";
})(GalleryFolder || (exports.GalleryFolder = GalleryFolder = {}));
exports.FOLDER_LABELS = {
    [GalleryFolder.PREMIUM_QUALITY]: 'Premium Quality',
    [GalleryFolder.QUICK_SERVICE]: 'Quick Service',
    [GalleryFolder.EXPERT_STYLISTS]: 'Expert Stylists',
    [GalleryFolder.HYGIENE_FIRST]: 'Hygiene First',
};
let GalleryItem = class GalleryItem {
};
exports.GalleryItem = GalleryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GalleryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], GalleryItem.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 's3_key', type: 'text' }),
    __metadata("design:type", String)
], GalleryItem.prototype, "s3Key", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GalleryItem.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: GalleryItemType, default: GalleryItemType.IMAGE }),
    __metadata("design:type", String)
], GalleryItem.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: GalleryFolder, default: GalleryFolder.PREMIUM_QUALITY }),
    __metadata("design:type", String)
], GalleryItem.prototype, "folder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_name', type: 'text' }),
    __metadata("design:type", String)
], GalleryItem.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], GalleryItem.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size', type: 'int' }),
    __metadata("design:type", Number)
], GalleryItem.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GalleryItem.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], GalleryItem.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: true }),
    __metadata("design:type", Boolean)
], GalleryItem.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', nullable: true }),
    __metadata("design:type", Number)
], GalleryItem.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GalleryItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], GalleryItem.prototype, "updatedAt", void 0);
exports.GalleryItem = GalleryItem = __decorate([
    (0, typeorm_1.Entity)('gallery_item')
], GalleryItem);
//# sourceMappingURL=gallery.entity.js.map