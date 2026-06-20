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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_entity_1 = require("./service.entity");
const aws_service_1 = require("../aws/aws.service");
let ServicesService = class ServicesService {
    constructor(serviceRepo, awsService) {
        this.serviceRepo = serviceRepo;
        this.awsService = awsService;
    }
    async findAll() {
        return this.serviceRepo.find({ order: { name: 'ASC' } });
    }
    async findOne(id) {
        const service = await this.serviceRepo.findOne({ where: { id } });
        if (!service)
            throw new common_1.NotFoundException(`Service ${id} not found`);
        return service;
    }
    async createService(dto) {
        let imageUrl;
        if (dto.imageFile) {
            const uploaded = await this.awsService.uploadFile(dto.imageFile, 'services');
            imageUrl = uploaded.url;
        }
        const service = this.serviceRepo.create({
            name: dto.name,
            priceCents: dto.priceCents,
            durationMinutes: dto.durationMinutes,
            description: dto.description,
            tag: dto.tag,
            imageUrl,
        });
        return this.serviceRepo.save(service);
    }
    async updateService(id, dto) {
        const service = await this.findOne(id);
        if (dto.name !== undefined)
            service.name = dto.name;
        if (dto.priceCents !== undefined)
            service.priceCents = dto.priceCents;
        if (dto.durationMinutes !== undefined)
            service.durationMinutes = dto.durationMinutes;
        if (dto.description !== undefined)
            service.description = dto.description;
        if (dto.tag !== undefined)
            service.tag = dto.tag;
        if (dto.imageFile) {
            const uploaded = await this.awsService.uploadFile(dto.imageFile, 'services');
            service.imageUrl = uploaded.url;
        }
        return this.serviceRepo.save(service);
    }
    async deleteService(id) {
        const service = await this.findOne(id);
        await this.serviceRepo.remove(service);
        return { message: `Service "${service.name}" deleted` };
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        aws_service_1.AwsService])
], ServicesService);
//# sourceMappingURL=services.service.js.map