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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor() {
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.transporter = null;
        const email = process.env.OWNER_EMAIL;
        const pass = process.env.OWNER_EMAIL_PASSWORD;
        if (!email || !pass) {
            this.logger.warn('OWNER_EMAIL or OWNER_EMAIL_PASSWORD not set — email notifications disabled');
            return;
        }
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: email, pass },
        });
    }
    async sendOwnerEmail(subject, text) {
        if (!this.transporter) {
            this.logger.warn(`Email not sent (no transporter): ${subject}`);
            return;
        }
        try {
            const email = process.env.OWNER_EMAIL;
            await this.transporter.sendMail({ from: email, to: email, subject, text });
            this.logger.log(`Owner email sent: ${subject}`);
        }
        catch (err) {
            this.logger.error('Failed to send owner email');
            this.logger.error(err);
        }
    }
    async notifyNewBooking(booking) {
        await this.sendOwnerEmail(`New Booking (#${booking.id})`, `New booking:\n\nName: ${booking.clientName}\nPhone: ${booking.clientPhone}\nService: ${booking.serviceId}\nStart: ${booking.startAt}\nStatus: ${booking.status}`);
    }
    async notifyCancelledBooking(booking) {
        await this.sendOwnerEmail(`Booking Cancelled (#${booking.id})`, `Booking cancelled:\n\nName: ${booking.clientName}\nPhone: ${booking.clientPhone}\nStart: ${booking.startAt}`);
    }
    async notifyPaymentSuccess(booking) {
        await this.sendOwnerEmail(`Payment Received — Booking #${booking.id}`, `Payment completed:\n\nName: ${booking.clientName}\nPhone: ${booking.clientPhone}\nStart: ${booking.startAt}`);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NotificationsService);
//# sourceMappingURL=notification.service.js.map