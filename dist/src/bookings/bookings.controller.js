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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const booking_service_1 = require("./booking.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const jwt_optional_guard_1 = require("../auth/jwt-optional.guard");
let BookingsController = class BookingsController {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async create(createBookingDto, req) {
        const userId = req.user?.sub ?? undefined;
        console.log('👤 Booking userId:', userId);
        return this.bookingService.create(createBookingDto, userId);
    }
    async getStats() {
        return this.bookingService.getStats();
    }
    async getMyBookings(req) {
        return this.bookingService.findMyBookings(req.user.sub);
    }
    async checkAvailability(query) {
        try {
            const { serviceId, startAt, durationMinutes } = query;
            if (!serviceId || !startAt) {
                throw new common_1.BadRequestException('serviceId and startAt are required');
            }
            const start = new Date(startAt);
            if (isNaN(start.getTime())) {
                throw new common_1.BadRequestException('Invalid startAt date');
            }
            const minutes = durationMinutes !== undefined ? Number(durationMinutes) : undefined;
            return await this.bookingService.checkAvailability(serviceId, start, minutes);
        }
        catch (err) {
            console.error('🔥 Availability check crashed:', err);
            throw err;
        }
    }
    async cancel(id) {
        return this.bookingService.cancelBooking(parseInt(id, 10));
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_optional_guard_1.JwtOptionalGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('my-bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getMyBookings", null);
__decorate([
    (0, common_1.Get)('availability/check'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancel", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map