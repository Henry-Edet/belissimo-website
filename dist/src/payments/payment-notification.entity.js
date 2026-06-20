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
exports.PaymentNotification = exports.NotificationStatus = void 0;
const typeorm_1 = require("typeorm");
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["CONFIRMED"] = "confirmed";
    NotificationStatus["REJECTED"] = "rejected";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
let PaymentNotification = class PaymentNotification {
};
exports.PaymentNotification = PaymentNotification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PaymentNotification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_id' }),
    __metadata("design:type", Number)
], PaymentNotification.prototype, "bookingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name' }),
    __metadata("design:type", String)
], PaymentNotification.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_phone', nullable: true }),
    __metadata("design:type", String)
], PaymentNotification.prototype, "clientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_cents' }),
    __metadata("design:type", Number)
], PaymentNotification.prototype, "amountCents", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method' }),
    __metadata("design:type", String)
], PaymentNotification.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference', nullable: true }),
    __metadata("design:type", String)
], PaymentNotification.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
    }),
    __metadata("design:type", String)
], PaymentNotification.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_note', nullable: true }),
    __metadata("design:type", String)
], PaymentNotification.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaymentNotification.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', nullable: true }),
    __metadata("design:type", Date)
], PaymentNotification.prototype, "confirmedAt", void 0);
exports.PaymentNotification = PaymentNotification = __decorate([
    (0, typeorm_1.Entity)('payment_notification')
], PaymentNotification);
//# sourceMappingURL=payment-notification.entity.js.map