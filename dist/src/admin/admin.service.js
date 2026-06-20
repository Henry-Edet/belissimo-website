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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = exports.takenOverSessions = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../bookings/booking.entity");
const user_entity_1 = require("../users/user.entity");
const service_entity_1 = require("../services/service.entity");
const payment_entity_1 = require("../payments/payment.entity");
const chat_message_entity_1 = require("../chat/chat-message.entity");
const notification_service_1 = require("../notifications/notification.service");
exports.takenOverSessions = new Set();
let AdminService = AdminService_1 = class AdminService {
    constructor(bookingRepo, userRepo, serviceRepo, paymentRepo, chatRepo, notifications) {
        this.bookingRepo = bookingRepo;
        this.userRepo = userRepo;
        this.serviceRepo = serviceRepo;
        this.paymentRepo = paymentRepo;
        this.chatRepo = chatRepo;
        this.notifications = notifications;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getStats() {
        const [total, pending, confirmed, cancelled, completed, totalClients] = await Promise.all([
            this.bookingRepo.count(),
            this.bookingRepo.count({ where: { status: 'pending' } }),
            this.bookingRepo.count({ where: { status: 'confirmed' } }),
            this.bookingRepo.count({ where: { status: 'cancelled' } }),
            this.bookingRepo.count({ where: { status: 'completed' } }),
            this.userRepo.count(),
        ]);
        const paidPayments = await this.paymentRepo.find({
            where: { status: payment_entity_1.PaymentStatus.PAID },
        });
        const totalRevenueCents = paidPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const totalRevenue = (totalRevenueCents / 100).toFixed(2);
        const totalPayments = paidPayments.length;
        const aiBookings = await this.chatRepo.count({
            where: { action: 'CREATE_BOOKING_AND_PAYMENT' },
        });
        const recentBookings = await this.bookingRepo.find({
            order: { startAt: 'DESC' },
            take: 10,
            relations: ['service'],
        });
        return {
            totalBookings: total,
            pending,
            confirmed,
            cancelled,
            completed,
            totalClients,
            totalRevenue,
            totalPayments,
            aiBookings,
            recentBookings,
        };
    }
    async getRevenue() {
        const payments = await this.paymentRepo.find({
            where: { status: payment_entity_1.PaymentStatus.PAID },
            order: { createdAt: 'DESC' },
        });
        const totalCents = payments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const byMonth = {};
        payments.forEach((p) => {
            const month = new Date(p.createdAt).toLocaleDateString('en-US', {
                month: 'short', year: 'numeric',
            });
            byMonth[month] = (byMonth[month] || 0) + p.amountCents;
        });
        return {
            totalRevenueCents: totalCents,
            totalRevenue: `$${(totalCents / 100).toFixed(2)}`,
            paymentCount: payments.length,
            byMonth: Object.entries(byMonth).map(([month, cents]) => ({
                month, revenue: `$${(cents / 100).toFixed(2)}`, cents,
            })),
            recentPayments: payments.slice(0, 20),
        };
    }
    async getAllBookings(status, limit = 50, offset = 0) {
        const where = status ? { status } : {};
        const [bookings, total] = await this.bookingRepo.findAndCount({
            where,
            order: { startAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['service'],
        });
        return { bookings, total };
    }
    async confirmBooking(id) {
        const booking = await this.bookingRepo.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException(`Booking #${id} not found`);
        booking.status = 'confirmed';
        return this.bookingRepo.save(booking);
    }
    async cancelBooking(id) {
        const booking = await this.bookingRepo.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException(`Booking #${id} not found`);
        booking.status = 'cancelled';
        const saved = await this.bookingRepo.save(booking);
        await this.notifications.notifyCancelledBooking(saved);
        return saved;
    }
    async markOwing(id, balanceCents) {
        const booking = await this.bookingRepo.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException(`Booking #${id} not found`);
        booking.paymentStatus = booking_entity_1.PaymentStatus.OWING;
        booking.balanceCents = balanceCents;
        const saved = await this.bookingRepo.save(booking);
        await this.notifications.sendOwnerEmail(`Client Owing — Booking #${id}`, `${booking.clientName} has an outstanding balance of $${(balanceCents / 100).toFixed(2)}.`);
        return saved;
    }
    async markCompleted(id) {
        const booking = await this.bookingRepo.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException(`Booking #${id} not found`);
        booking.paymentStatus = booking_entity_1.PaymentStatus.COMPLETED;
        booking.balanceCents = 0;
        const saved = await this.bookingRepo.save(booking);
        await this.notifications.sendOwnerEmail(`Payment Completed — Booking #${id}`, `${booking.clientName} has completed full payment for booking #${id}.`);
        return saved;
    }
    async getAllClients() {
        return this.userRepo.find({
            order: { createdAt: 'DESC' },
            select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt'],
        });
    }
    async getChatSessions() {
        const sessions = await this.chatRepo
            .createQueryBuilder('m')
            .select('m.session_id', 'sessionId')
            .addSelect('MAX(m.created_at)', 'lastActivity')
            .addSelect('MAX(m.client_name)', 'clientName')
            .addSelect('COUNT(m.id)', 'messageCount')
            .addSelect('BOOL_OR(m.flagged_for_takeover)', 'flagged')
            .addSelect('BOOL_OR(m.admin_taken_over)', 'takenOver')
            .groupBy('m.session_id')
            .orderBy('MAX(m.created_at)', 'DESC')
            .limit(50)
            .getRawMany();
        return sessions.map((s) => ({
            ...s,
            takenOver: s.takenOver || exports.takenOverSessions.has(s.sessionId),
        }));
    }
    async getChatSession(sessionId) {
        return this.chatRepo.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
    }
    async flagSession(sessionId) {
        await this.chatRepo
            .createQueryBuilder()
            .update(chat_message_entity_1.ChatMessage)
            .set({ flaggedForTakeover: true })
            .where('session_id = :sessionId', { sessionId })
            .execute();
        return { message: `Session ${sessionId} flagged for admin takeover` };
    }
    async takeoverSession(sessionId) {
        exports.takenOverSessions.add(sessionId);
        await this.chatRepo
            .createQueryBuilder()
            .update(chat_message_entity_1.ChatMessage)
            .set({ adminTakenOver: true, flaggedForTakeover: false })
            .where('session_id = :sessionId', { sessionId })
            .execute();
        await this.notifications.sendOwnerEmail(`Chat Takeover — Session ${sessionId}`, `You have taken over chat session ${sessionId}. Bella will not respond until you release.`);
        return { sessionId, takenOver: true };
    }
    async releaseSession(sessionId) {
        exports.takenOverSessions.delete(sessionId);
        return { sessionId, takenOver: false };
    }
    async sendAdminChatMessage(sessionId, message) {
        const msg = this.chatRepo.create({
            sessionId,
            sender: 'admin',
            message,
            reply: message,
            createdAt: new Date(),
        });
        return this.chatRepo.save(msg);
    }
    async getClientSessionMessages(sessionId) {
        const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const msgs = await this.chatRepo.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
        return msgs.filter(m => new Date(m.createdAt) > cutoff);
    }
    async clearAllChatHistory() {
        const result = await this.chatRepo.createQueryBuilder()
            .delete().from(chat_message_entity_1.ChatMessage).execute();
        return { deleted: result.affected ?? 0 };
    }
    async cleanupOldMessages() {
        const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const result = await this.chatRepo
            .createQueryBuilder()
            .delete()
            .from(chat_message_entity_1.ChatMessage)
            .where('created_at < :cutoff', { cutoff })
            .execute();
        const deleted = result.affected ?? 0;
        if (deleted > 0)
            this.logger.log(`Cleaned up ${deleted} chat messages older than 72 hours`);
        return deleted;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __param(3, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(4, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notification_service_1.NotificationsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map