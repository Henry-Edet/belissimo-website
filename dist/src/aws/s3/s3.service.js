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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const AWS = require("aws-sdk");
const crypto = require("crypto");
let S3Service = S3Service_1 = class S3Service {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(S3Service_1.name);
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID') || '';
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY') || '';
        const region = this.configService.get('AWS_REGION') || 'us-east-1';
        const bucketName = this.configService.get('AWS_S3_BUCKET_NAME') || '';
        const endpoint = this.configService.get('AWS_S3_ENDPOINT');
        const s3ForcePathStyle = this.configService.get('AWS_S3_FORCE_PATH_STYLE', false);
        if (!accessKeyId || !secretAccessKey || !bucketName) {
            this.logger.warn('AWS S3 configuration is incomplete. Some features may not work.');
        }
        this.s3 = new AWS.S3({
            accessKeyId,
            secretAccessKey,
            region,
            endpoint,
            s3ForcePathStyle,
            signatureVersion: 'v4',
        });
        this.bucketName = bucketName;
        if (bucketName) {
            if (endpoint) {
                this.baseUrl = `${endpoint}/${bucketName}`;
            }
            else {
                this.baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;
            }
        }
        else {
            this.baseUrl = '';
        }
    }
    async uploadFile(file, fileName, folder = 'uploads', contentType) {
        try {
            if (!this.bucketName) {
                throw new Error('S3 bucket not configured. Please check AWS_S3_BUCKET_NAME in environment variables.');
            }
            const uniqueFileName = this.generateUniqueFileName(fileName);
            const key = `${folder}/${uniqueFileName}`;
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Body: file,
                ContentType: contentType || this.getContentType(fileName),
                ACL: 'public-read',
                Metadata: {
                    originalName: fileName,
                    uploadedAt: new Date().toISOString(),
                },
            };
            const result = await this.s3.upload(params).promise();
            return {
                url: `${this.baseUrl}/${key}`,
                key: result.Key,
                etag: result.ETag,
            };
        }
        catch (error) {
            this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }
    async deleteFile(key) {
        try {
            if (!this.bucketName) {
                throw new Error('S3 bucket not configured');
            }
            const params = {
                Bucket: this.bucketName,
                Key: key,
            };
            await this.s3.deleteObject(params).promise();
            this.logger.log(`Successfully deleted file: ${key}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
            throw new Error(`S3 delete failed: ${error.message}`);
        }
    }
    async fileExists(key) {
        try {
            if (!this.bucketName) {
                return false;
            }
            const params = {
                Bucket: this.bucketName,
                Key: key,
            };
            await this.s3.headObject(params).promise();
            return true;
        }
        catch (error) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }
    async getFileMetadata(key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key,
            };
            return await this.s3.headObject(params).promise();
        }
        catch (error) {
            this.logger.error(`Failed to get file metadata: ${error.message}`, error.stack);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }
    async listFiles(prefix = '', maxKeys = 100) {
        try {
            const params = {
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys,
            };
            const result = await this.s3.listObjectsV2(params).promise();
            return result.Contents || [];
        }
        catch (error) {
            this.logger.error(`Failed to list files: ${error.message}`, error.stack);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }
    async getSignedUrl(key, expiresIn = 3600, operation = 'getObject') {
        try {
            if (!this.bucketName) {
                throw new Error('S3 bucket not configured');
            }
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Expires: expiresIn,
            };
            if (operation === 'getObject') {
                return this.s3.getSignedUrlPromise('getObject', params);
            }
            else {
                return this.s3.getSignedUrlPromise('putObject', params);
            }
        }
        catch (error) {
            this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }
    generateUniqueFileName(originalName) {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const lastDotIndex = originalName.lastIndexOf('.');
        let nameWithoutExtension = originalName;
        let extension = '';
        if (lastDotIndex !== -1) {
            nameWithoutExtension = originalName.substring(0, lastDotIndex);
            extension = originalName.substring(lastDotIndex + 1);
        }
        const cleanName = nameWithoutExtension
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (extension) {
            return `${cleanName}-${timestamp}-${randomString}.${extension}`;
        }
        else {
            return `${cleanName}-${timestamp}-${randomString}`;
        }
    }
    getContentType(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        if (!extension) {
            return 'application/octet-stream';
        }
        const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            bmp: 'image/bmp',
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            txt: 'text/plain',
            zip: 'application/zip',
            rar: 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            mp3: 'audio/mpeg',
            mp4: 'video/mp4',
            mpeg: 'video/mpeg',
            avi: 'video/x-msvideo',
            mov: 'video/quicktime',
            wav: 'audio/wav',
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map