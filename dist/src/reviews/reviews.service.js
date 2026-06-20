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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./review.entity");
let ReviewsService = class ReviewsService {
    constructor(reviewRepo) {
        this.reviewRepo = reviewRepo;
    }
    async create(dto) {
        if (dto.rating < 1 || dto.rating > 5)
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        if (!dto.comment?.trim())
            throw new common_1.BadRequestException('Comment is required');
        const existing = await this.reviewRepo.findOne({ where: { bookingId: dto.bookingId } });
        if (existing)
            throw new common_1.BadRequestException('You have already reviewed this booking');
        const review = this.reviewRepo.create(dto);
        return this.reviewRepo.save(review);
    }
    async findAll() {
        return this.reviewRepo.find({ order: { createdAt: 'DESC' } });
    }
    async likeReview(id) {
        const review = await this.reviewRepo.findOne({ where: { id } });
        if (!review)
            throw new common_1.BadRequestException('Review not found');
        review.likes += 1;
        return this.reviewRepo.save(review);
    }
    async getReviewForBooking(bookingId) {
        return this.reviewRepo.findOne({ where: { bookingId } }) ?? null;
    }
    async hasReview(bookingId) {
        const review = await this.reviewRepo.findOne({ where: { bookingId } });
        return !!review;
    }
    async getStats() {
        const reviews = await this.reviewRepo.find();
        if (reviews.length === 0) {
            return { totalReviews: 0, averageRating: 0, satisfactionRate: 0, happyClients: 0 };
        }
        const total = reviews.length;
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
        const happy = reviews.filter(r => r.rating >= 4).length;
        const satisfactionRate = total >= 3 ? Math.round((happy / total) * 100) : 0;
        return {
            totalReviews: total,
            averageRating: Math.round(avg * 10) / 10,
            satisfactionRate,
            happyClients: happy,
        };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map