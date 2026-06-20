"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const booking_entity_1 = require("../bookings/booking.entity");
const user_entity_1 = require("../users/user.entity");
const service_entity_1 = require("../services/service.entity");
const payment_entity_1 = require("../payments/payment.entity");
const chat_message_entity_1 = require("../chat/chat-message.entity");
const notification_module_1 = require("../notifications/notification.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([booking_entity_1.Booking, user_entity_1.User, service_entity_1.Service, payment_entity_1.Payment, chat_message_entity_1.ChatMessage]),
            notification_module_1.NotificationModule,
        ],
        controllers: [admin_controller_1.AdminController, admin_controller_1.ChatClientController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map