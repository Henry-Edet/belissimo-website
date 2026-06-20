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
var S3Config_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Config = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let S3Config = S3Config_1 = class S3Config {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(S3Config_1.name);
        this.accessKeyId = this.getRequired('AWS_ACCESS_KEY_ID');
        this.secretAccessKey = this.getRequired('AWS_SECRET_ACCESS_KEY');
        this.bucketName = this.getRequired('AWS_S3_BUCKET_NAME');
        this.region = configService.get('AWS_REGION') || 'us-east-1';
        this.endpoint = configService.get('AWS_S3_ENDPOINT');
        this.s3ForcePathStyle = configService.get('AWS_S3_FORCE_PATH_STYLE', false);
    }
    getRequired(key) {
        const value = this.configService.get(key);
        if (!value) {
            const message = `Missing required S3 configuration: ${key}`;
            this.logger.error(message);
            throw new Error(message);
        }
        return value;
    }
    get baseUrl() {
        if (this.endpoint) {
            return `${this.endpoint}/${this.bucketName}`;
        }
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    }
};
exports.S3Config = S3Config;
exports.S3Config = S3Config = S3Config_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Config);
//# sourceMappingURL=s3-config.factory.js.map