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
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const jwt_optional_guard_1 = require("../auth/jwt-optional.guard");
const roles_guard_1 = require("../auth/roles.guard");
const role_decorator_1 = require("../auth/role.decorator");
const user_entity_1 = require("../users/user.entity");
const stripe_1 = require("stripe");
const config_1 = require("@nestjs/config");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    constructor(paymentsService, config) {
        this.paymentsService = paymentsService;
        this.config = config;
        this.logger = new common_1.Logger(PaymentsController_1.name);
        const secretKey = this.config.get('STRIPE_SECRET_KEY');
        if (!secretKey)
            throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
        this.stripe = new stripe_1.default(secretKey, { apiVersion: '2024-06-20' });
    }
    async createSession(body) {
        return this.paymentsService.createCheckoutSession(body.bookingId);
    }
    async createBalanceSession(body) {
        return this.paymentsService.createBalanceCheckoutSession(body.bookingId);
    }
    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            this.logger.error('STRIPE_WEBHOOK_SECRET missing');
            return res.status(500).send('Webhook secret not configured');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
        catch (err) {
            this.logger.error(`Webhook signature failed: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        this.logger.log(`Received Stripe event: ${event.type}`);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            await this.paymentsService.handleStripeCheckoutCompleted(session);
        }
        return res.json({ received: true });
    }
    async notifyDeposit(body) {
        return this.paymentsService.notifyDepositEmail(body);
    }
    async notifyPayment(body) {
        return this.paymentsService.notifyManualPayment(body);
    }
    async notifyStripeBalance(body) {
        return this.paymentsService.notifyManualPayment({
            bookingId: body.bookingId,
            clientName: body.clientName,
            amountCents: body.amountCents,
            paymentMethod: 'card',
            isBalancePayment: true,
            reference: 'Stripe payment — auto-notified',
        });
    }
    async getNotifications() {
        return this.paymentsService.getAllNotifications();
    }
    async confirmNotification(id, body) {
        return this.paymentsService.confirmNotification(parseInt(id), body.adminNote);
    }
    async rejectNotification(id, body) {
        return this.paymentsService.rejectNotification(parseInt(id), body.adminNote);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('create-session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('balance-session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createBalanceSession", null);
__decorate([
    (0, common_1.HttpCode)(200),
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('notify-deposit'),
    (0, common_1.UseGuards)(jwt_optional_guard_1.JwtOptionalGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "notifyDeposit", null);
__decorate([
    (0, common_1.Post)('notify'),
    (0, common_1.UseGuards)(jwt_optional_guard_1.JwtOptionalGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "notifyPayment", null);
__decorate([
    (0, common_1.Post)('notify-stripe-balance'),
    (0, common_1.UseGuards)(jwt_optional_guard_1.JwtOptionalGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "notifyStripeBalance", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "confirmNotification", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Roles)(user_entity_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "rejectNotification", null);
exports.PaymentsController = PaymentsController = PaymentsController_1 = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        config_1.ConfigService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map