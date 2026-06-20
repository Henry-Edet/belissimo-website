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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = require("stripe");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../bookings/booking.entity");
const payment_entity_1 = require("./payment.entity");
const payment_notification_entity_1 = require("./payment-notification.entity");
const service_entity_1 = require("../services/service.entity");
const config_1 = require("@nestjs/config");
const notification_service_1 = require("../notifications/notification.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(paymentsRepo, bookingRepo, serviceRepo, notificationRepo, config, notifications) {
        this.paymentsRepo = paymentsRepo;
        this.bookingRepo = bookingRepo;
        this.serviceRepo = serviceRepo;
        this.notificationRepo = notificationRepo;
        this.config = config;
        this.notifications = notifications;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        const secretKey = this.config.get('STRIPE_SECRET_KEY');
        if (!secretKey)
            throw new Error('STRIPE_SECRET_KEY is missing');
        this.stripe = new stripe_1.default(secretKey, { apiVersion: '2024-06-20' });
    }
    async createCheckoutSession(bookingId) {
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const service = await this.serviceRepo.findOne({ where: { id: String(booking.serviceId) } });
        const priceCents = service?.priceCents ?? 0;
        const depositCents = Math.round(priceCents * 0.3);
        const serviceName = service?.name ?? 'Hair Service';
        const payment = this.paymentsRepo.create({
            bookingId,
            amountCents: depositCents,
            currency: 'USD',
            provider: 'stripe',
            status: payment_entity_1.PaymentStatus.PENDING,
        });
        const saved = await this.paymentsRepo.save(payment);
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: { name: `Deposit — ${serviceName}` },
                        unit_amount: depositCents,
                    },
                    quantity: 1,
                }],
            success_url: `${this.config.get('FRONTEND_SUCCESS_URL')}?booking=${bookingId}`,
            cancel_url: `${this.config.get('FRONTEND_CANCEL_URL')}?booking=${bookingId}`,
            metadata: {
                bookingId: String(bookingId),
                paymentId: String(saved.id),
            },
        });
        saved.providerId = session.id;
        await this.paymentsRepo.save(saved);
        return { url: session.url, sessionId: session.id, paymentId: saved.id };
    }
    async createBalanceCheckoutSession(bookingId) {
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const balanceCents = booking.balanceCents;
        if (!balanceCents || balanceCents <= 0) {
            throw new common_1.BadRequestException('No outstanding balance for this booking');
        }
        const service = await this.serviceRepo.findOne({ where: { id: String(booking.serviceId) } });
        const serviceName = service?.name ?? 'Hair Service';
        const payment = this.paymentsRepo.create({
            bookingId,
            amountCents: balanceCents,
            currency: 'USD',
            provider: 'stripe',
            status: payment_entity_1.PaymentStatus.PENDING,
        });
        const saved = await this.paymentsRepo.save(payment);
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: { name: `Outstanding Balance — ${serviceName}` },
                        unit_amount: balanceCents,
                    },
                    quantity: 1,
                }],
            success_url: `${this.config.get('FRONTEND_SUCCESS_URL')}?booking=${bookingId}&type=balance`,
            cancel_url: `${this.config.get('FRONTEND_CANCEL_URL')}?booking=${bookingId}`,
            metadata: {
                bookingId: String(bookingId),
                paymentId: String(saved.id),
                isBalancePayment: 'true',
            },
        });
        saved.providerId = session.id;
        await this.paymentsRepo.save(saved);
        return { url: session.url, sessionId: session.id, paymentId: saved.id };
    }
    async handleStripeCheckoutCompleted(session) {
        const metadata = session.metadata ?? {};
        const paymentIdStr = metadata.paymentId;
        const bookingId = parseInt(metadata.bookingId ?? '0', 10);
        if (!paymentIdStr || !bookingId) {
            this.logger.warn('Webhook missing metadata', metadata);
            return;
        }
        const paymentId = parseInt(paymentIdStr, 10);
        if (isNaN(paymentId)) {
            this.logger.warn(`Invalid paymentId in metadata: ${paymentIdStr}`);
            return;
        }
        const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
        if (!payment) {
            this.logger.warn(`Payment ${paymentId} not found`);
            return;
        }
        payment.status = payment_entity_1.PaymentStatus.PAID;
        await this.paymentsRepo.save(payment);
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (booking) {
            booking.status = 'confirmed';
            if (metadata.isBalancePayment === 'true') {
                booking.paymentStatus = 'completed';
                booking.balanceCents = 0;
                await this.notifications.sendOwnerEmail(`Balance Paid via Card — Booking #${bookingId}`, `${booking.clientName} has paid their outstanding balance via Stripe for booking #${bookingId}.\n\nPlease verify in your Stripe dashboard and click "Payment Complete" on the booking to release their account.`);
            }
            else {
                await this.notifications.sendOwnerEmail(`Deposit Received — Booking #${bookingId}`, `${booking.clientName} paid a deposit for booking #${bookingId}. The booking is now confirmed.`);
            }
            await this.bookingRepo.save(booking);
        }
        this.logger.log(`Payment ${paymentId} marked PAID for booking ${bookingId}`);
    }
    async notifyDepositEmail(dto) {
        const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
        if (!booking)
            return { message: 'Booking not found — email not sent' };
        const methodLabel = dto.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Crypto Transfer';
        const amountLabel = `$${(dto.amountCents / 100).toFixed(2)}`;
        await this.notifications.sendOwnerEmail(`💳 Deposit Proof Sent — Booking #${dto.bookingId}`, `${dto.clientName} has sent deposit proof via ${methodLabel} for booking #${dto.bookingId}.\n\n` +
            `Amount: ${amountLabel}\n` +
            `Phone: ${dto.clientPhone ?? 'Not provided'}\n\n` +
            `Please check your ${dto.paymentMethod === 'bank_transfer' ? 'GTBank account' : 'crypto wallet'} to verify the payment, then confirm the booking in your Admin → Bookings tab.`);
        return { message: 'Admin notified by email' };
    }
    async notifyManualPayment(dto) {
        if (!dto.isBalancePayment) {
            throw new common_1.BadRequestException('Deposit payments do not require manual notification. Only balance payments are tracked here.');
        }
        const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const notification = this.notificationRepo.create({
            bookingId: dto.bookingId,
            clientName: dto.clientName,
            clientPhone: dto.clientPhone,
            amountCents: dto.amountCents,
            paymentMethod: dto.paymentMethod,
            reference: dto.reference,
            status: payment_notification_entity_1.NotificationStatus.PENDING,
        });
        const saved = await this.notificationRepo.save(notification);
        const methodLabel = dto.paymentMethod === 'bank_transfer' ? 'Bank Transfer'
            : dto.paymentMethod === 'crypto' ? 'Crypto Transfer' : 'Card (Stripe)';
        const amountLabel = `$${(dto.amountCents / 100).toFixed(2)}`;
        await this.notifications.sendOwnerEmail(`⚠️ Balance Payment Notified — Booking #${dto.bookingId}`, `${dto.clientName} has notified a ${methodLabel} balance payment of ${amountLabel} for booking #${dto.bookingId}.\n\n` +
            `Reference/Hash: ${dto.reference ?? 'Not provided'}\n` +
            `Phone: ${dto.clientPhone ?? 'Not provided'}\n\n` +
            `Please verify then click "Confirm & Release" in your admin Payments tab to unlock their account.`);
        return saved;
    }
    async getPendingNotifications() {
        return this.notificationRepo.find({
            where: { status: payment_notification_entity_1.NotificationStatus.PENDING },
            order: { createdAt: 'DESC' },
        });
    }
    async getAllNotifications() {
        return this.notificationRepo.find({
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async confirmNotification(notificationId, adminNote) {
        const notification = await this.notificationRepo.findOne({ where: { id: notificationId } });
        if (!notification)
            throw new common_1.NotFoundException('Notification not found');
        notification.status = payment_notification_entity_1.NotificationStatus.CONFIRMED;
        notification.confirmedAt = new Date();
        notification.adminNote = adminNote;
        await this.notificationRepo.save(notification);
        const booking = await this.bookingRepo.findOne({ where: { id: notification.bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        booking.paymentStatus = 'completed';
        booking.balanceCents = 0;
        booking.status = 'completed';
        await this.bookingRepo.save(booking);
        await this.notifications.sendOwnerEmail(`✅ Balance Confirmed — Booking #${notification.bookingId}`, `You confirmed the balance payment from ${notification.clientName}. Their account has been released and booking marked completed.`);
        return { notification, booking };
    }
    async rejectNotification(notificationId, adminNote) {
        const notification = await this.notificationRepo.findOne({ where: { id: notificationId } });
        if (!notification)
            throw new common_1.NotFoundException('Notification not found');
        notification.status = payment_notification_entity_1.NotificationStatus.REJECTED;
        notification.adminNote = adminNote ?? 'Payment not found. Please re-submit with correct reference.';
        await this.notificationRepo.save(notification);
        return notification;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __param(3, (0, typeorm_1.InjectRepository)(payment_notification_entity_1.PaymentNotification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notification_service_1.NotificationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map