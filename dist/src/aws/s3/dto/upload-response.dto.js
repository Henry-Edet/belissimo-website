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
exports.BulkUploadResponseDto = exports.UploadResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UploadResponseDto {
}
exports.UploadResponseDto = UploadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Public URL of the uploaded file',
        example: 'https://bucket.s3.region.amazonaws.com/uploads/filename.jpg',
    }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'S3 key/path of the uploaded file',
        example: 'uploads/filename-1234567890-abc123def456.jpg',
    }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ETag of the uploaded file',
        example: '"abc123def456ghi789"',
    }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "etag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original filename',
        example: 'profile.jpg',
        required: false,
    }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "originalName", void 0);
class BulkUploadResponseDto {
}
exports.BulkUploadResponseDto = BulkUploadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [UploadResponseDto],
        description: 'Array of uploaded files',
    }),
    __metadata("design:type", Array)
], BulkUploadResponseDto.prototype, "files", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of successfully uploaded files',
        example: 3,
    }),
    __metadata("design:type", Number)
], BulkUploadResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Folder where files were uploaded',
        example: 'gallery',
    }),
    __metadata("design:type", String)
], BulkUploadResponseDto.prototype, "folder", void 0);
//# sourceMappingURL=upload-response.dto.js.map