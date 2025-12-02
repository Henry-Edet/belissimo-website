import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const email = process.env.OWNER_EMAIL;
    const pass = process.env.OWNER_EMAIL_PASSWORD;

    if (!email || !pass) {
      throw new Error('OWNER_EMAIL and OWNER_EMAIL_PASSWORD must be set');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail', // easiest for now
      auth: {
        user: email,
        pass,
      },
    });
  }

  async sendOwnerEmail(subject: string, text: string) {
    try {
      const email = process.env.OWNER_EMAIL;

      await this.transporter.sendMail({
        from: email,
        to: email,
        subject,
        text,
      });

      this.logger.log(`Owner email sent: ${subject}`);
    } catch (err) {
      this.logger.error('Failed to send owner email', err);
    }
  }

  async notifyNewBooking(booking: any) {
    await this.sendOwnerEmail(
      `New Booking (#${booking.id})`,
      `A new booking was created:

Name: ${booking.clientName}
Phone: ${booking.clientPhone}
Service: ${booking.serviceId}
Start: ${booking.startAt}
Status: ${booking.status}
`
    );
  }

  async notifyCancelledBooking(booking: any) {
    await this.sendOwnerEmail(
      `Booking Cancelled (#${booking.id})`,
      `A booking was cancelled:

Name: ${booking.clientName}
Phone: ${booking.clientPhone}
Start: ${booking.startAt}
`
    );
  }

  async notifyPaymentSuccess(booking: any) {
    await this.sendOwnerEmail(
      `Payment Received for Booking #${booking.id}`,
      `Payment completed:

Name: ${booking.clientName}
Phone: ${booking.clientPhone}
Start: ${booking.startAt}
Booking is now CONFIRMED.
`
    );
  }
}
