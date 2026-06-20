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
exports.Booking = exports.PaymentStatus = void 0;
const typeorm_1 = require("typeorm");
const service_entity_1 = require("../services/service.entity");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["NONE"] = "none";
    PaymentStatus["DEPOSIT_PAID"] = "deposit_paid";
    PaymentStatus["OWING"] = "owing";
    PaymentStatus["COMPLETED"] = "completed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let Booking = class Booking {
};
exports.Booking = Booking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Booking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serviceId' }),
    __metadata("design:type", String)
], Booking.prototype, "serviceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_entity_1.Service),
    (0, typeorm_1.JoinColumn)({ name: 'serviceId' }),
    __metadata("design:type", service_entity_1.Service)
], Booking.prototype, "service", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clientName' }),
    __metadata("design:type", String)
], Booking.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clientPhone' }),
    __metadata("design:type", String)
], Booking.prototype, "clientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'userId', nullable: true }),
    __metadata("design:type", Number)
], Booking.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'startAt', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Booking.prototype, "startAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endAt', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Booking.prototype, "endAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subServiceName', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "subServiceName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.NONE,
    }),
    __metadata("design:type", String)
], Booking.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'balance_cents', default: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "balanceCents", void 0);
exports.Booking = Booking = __decorate([
    (0, typeorm_1.Entity)('booking')
], Booking);
//# sourceMappingURL=booking.entity.js.map