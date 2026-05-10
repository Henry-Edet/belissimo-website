// src/notifications/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
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

  async sendOwnerEmail(subject: string, text: string) {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (no transporter): ${subject}`);
      return;
    }
    try {
      const email = process.env.OWNER_EMAIL;
      await this.transporter.sendMail({ from: email, to: email, subject, text });
      this.logger.log(`Owner email sent: ${subject}`);
    } catch (err) {
      this.logger.error('Failed to send owner email');
      this.logger.error(err);
    }
  }

  async notifyNewBooking(booking: any) {
    await this.sendOwnerEmail(
      `New Booking (#${booking.id})`,
      `New booking:\n\nName: ${booking.clientName}\nPhone: ${booking.clientPhone}\nService: ${booking.serviceId}\nStart: ${booking.startAt}\nStatus: ${booking.status}`,
    );
  }

  async notifyCancelledBooking(booking: any) {
    await this.sendOwnerEmail(
      `Booking Cancelled (#${booking.id})`,
      `Booking cancelled:\n\nName: ${booking.clientName}\nPhone: ${booking.clientPhone}\nStart: ${booking.startAt}`,
    );
  }

  async notifyPaymentSuccess(booking: any) {
    await this.sendOwnerEmail(
      `Payment Received — Booking #${booking.id}`,
      `Payment completed:\n\nName: ${booking.clientName}\nPhone: ${booking.clientPhone}\nStart: ${booking.startAt}`,
    );
  }
}