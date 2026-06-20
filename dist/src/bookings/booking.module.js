"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const booking_entity_1 = require("./booking.entity");
const booking_service_1 = require("./booking.service");
const bookings_controller_1 = require("./bookings.controller");
const service_entity_1 = require("../services/service.entity");
const notification_module_1 = require("../notifications/notification.module");
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([booking_entity_1.Booking, service_entity_1.Service]),
            notification_module_1.NotificationModule,
        ],
        controllers: [bookings_controller_1.BookingsController],
        providers: [booking_service_1.BookingService],
        exports: [booking_service_1.BookingService],
    })
], BookingsModule);
//# sourceMappingURL=booking.module.js.map