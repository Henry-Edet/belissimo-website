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
exports.Service = void 0;
const typeorm_1 = require("typeorm");
const booking_entity_1 = require("../bookings/booking.entity");
let Service = class Service {
};
exports.Service = Service;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Service.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Service.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Service.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_minutes' }),
    __metadata("design:type", Number)
], Service.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_cents' }),
    __metadata("design:type", Number)
], Service.prototype, "priceCents", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deposit_percentage', default: 30 }),
    __metadata("design:type", Number)
], Service.prototype, "depositPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Service.prototype, "tag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], Service.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Service.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => booking_entity_1.Booking, (booking) => booking.service),
    __metadata("design:type", Array)
], Service.prototype, "bookings", void 0);
exports.Service = Service = __decorate([
    (0, typeorm_1.Entity)('services')
], Service);
//# sourceMappingURL=service.entity.js.map