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
exports.AdminController = exports.ChatClientController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const role_decorator_1 = require("../auth/role.decorator");
const user_entity_1 = require("../users/user.entity");
let ChatClientController = class ChatClientController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getClientMessages(sessionId) {
        return this.adminService.getClientSessionMessages(sessionId);
    }
};
exports.ChatClientController = ChatClientController;
__decorate([
    (0, common_1.Get)('client/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatClientController.prototype, "getClientMessages", null);
exports.ChatClientController = ChatClientController = __decorate([
    (0, common_1.Controller)('admin/chat'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], ChatClientController);
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getStats() { return this.adminService.getStats(); }
    getRevenue() { return this.adminService.getRevenue(); }
    getAllBookings(status, limit, offset) {
        return this.adminService.getAllBookings(status, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
    }
    confirmBooking(id) { return this.adminService.confirmBooking(parseInt(id)); }
    cancelBooking(id) { return this.adminService.cancelBooking(parseInt(id)); }
    markOwing(id, body) {
        return this.adminService.markOwing(parseInt(id), body.balanceCents);
    }
    markCompleted(id) { return this.adminService.markCompleted(parseInt(id)); }
    getAllClients() { return this.adminService.getAllClients(); }
    getChatSessions() { return this.adminService.getChatSessions(); }
    getChatSession(sessionId) {
        return this.adminService.getChatSession(sessionId);
    }
    flagSession(sessionId) { return this.adminService.flagSession(sessionId); }
    takeoverSession(sessionId) { return this.adminService.takeoverSession(sessionId); }
    releaseSession(sessionId) { return this.adminService.releaseSession(sessionId); }
    sendAdminMessage(sessionId, body) {
        return this.adminService.sendAdminChatMessage(sessionId, body.message);
    }
    clearAllChat() { return this.adminService.clearAllChatHistory(); }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('revenue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "confirmBooking", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/owing'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "markOwing", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/completed'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "markCompleted", null);
__decorate([
    (0, common_1.Get)('clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllClients", null);
__decorate([
    (0, common_1.Get)('chat/sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getChatSessions", null);
__decorate([
    (0, common_1.Get)('chat/sessions/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getChatSession", null);
__decorate([
    (0, common_1.Patch)('chat/sessions/:sessionId/flag'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "flagSession", null);
__decorate([
    (0, common_1.Patch)('chat/sessions/:sessionId/takeover'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "takeoverSession", null);
__decorate([
    (0, common_1.Patch)('chat/sessions/:sessionId/release'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "releaseSession", null);
__decorate([
    (0, common_1.Post)('chat/sessions/:sessionId/send'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "sendAdminMessage", null);
__decorate([
    (0, common_1.Post)('chat/clear'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "clearAllChat", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map