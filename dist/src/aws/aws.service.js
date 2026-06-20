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
var AwsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const path = require("path");
const crypto = require("crypto");
let AwsService = AwsService_1 = class AwsService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(AwsService_1.name);
        this.region = this.config.get('AWS_REGION') ?? 'us-east-1';
        this.bucket = this.config.get('AWS_S3_BUCKET') ?? 'belissimo-backend-uploads-12';
        this.s3 = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.config.get('AWS_ACCESS_KEY_ID') ?? '',
                secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY') ?? '',
            },
        });
    }
    async uploadFile(file, folder = 'gallery') {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${crypto.randomUUID()}${ext}`;
        const key = `${folder}/${uniqueName}`;
        const upload = new lib_storage_1.Upload({
            client: this.s3,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            },
        });
        await upload.done();
        const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
        this.logger.log(`Uploaded: ${key}`);
        return { url, key };
    }
    async deleteFile(key) {
        await this.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        this.logger.log(`Deleted: ${key}`);
    }
    async generateSignedUrl(key, expiresIn = 3600) {
        const command = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn });
    }
    getBucketUrl() {
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    }
};
exports.AwsService = AwsService;
exports.AwsService = AwsService = AwsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AwsService);
//# sourceMappingURL=aws.service.js.map