// src/payments/payments.service.ts
// Fixed: USD currency, balance checkout, payment notifications for bank/crypto

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, PaymentStatus } from '../bookings/booking.entity';
import { Payment, PaymentStatus as StripePaymentStatus } from './payment.entity';
import { PaymentNotification, NotificationStatus } from './payment-notification.entity';
import { Service } from '../services/service.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(PaymentNotification)
    private notificationRepo: Repository<PaymentNotification>,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing');
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });
  }

  // ── Stripe — Deposit Checkout ─────────────────────────────────────────────

  async createCheckoutSession(bookingId: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const service = await this.serviceRepo.findOne({ where: { id: String(booking.serviceId) } });
    const priceCents = service?.priceCents ?? 0;
    const depositCents = Math.round(priceCents * 0.3);
    const serviceName = service?.name ?? 'Hair Service';

    const payment = this.paymentsRepo.create({
      bookingId,
      amountCents: depositCents,
      currency: 'USD',
      provider: 'stripe',
      status: StripePaymentStatus.PENDING,
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

  // ── Stripe — Balance Checkout ─────────────────────────────────────────────

  async createBalanceCheckoutSession(bookingId: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const balanceCents = (booking as any).balanceCents;
    if (!balanceCents || balanceCents <= 0) {
      throw new BadRequestException('No outstanding balance for this booking');
    }

    const service = await this.serviceRepo.findOne({ where: { id: String(booking.serviceId) } });
    const serviceName = service?.name ?? 'Hair Service';

    const payment = this.paymentsRepo.create({
      bookingId,
      amountCents: balanceCents,
      currency: 'USD',
      provider: 'stripe',
      status: StripePaymentStatus.PENDING,
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

  // ── Stripe Webhook ────────────────────────────────────────────────────────

  async handleStripeCheckoutCompleted(session: Stripe.Checkout.Session) {
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
    if (!payment) { this.logger.warn(`Payment ${paymentId} not found`); return; }

    payment.status = StripePaymentStatus.PAID;
    await this.paymentsRepo.save(payment);

    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (booking) {
      booking.status = 'confirmed';
      if (metadata.isBalancePayment === 'true') {
        (booking as any).paymentStatus = 'completed';
        (booking as any).balanceCents = 0;
        // Notify admin that balance was paid via Stripe — they still confirm manually
        await this.notifications.sendOwnerEmail(
          `Balance Paid via Card — Booking #${bookingId}`,
          `${booking.clientName} has paid their outstanding balance via Stripe for booking #${bookingId}.\n\nPlease verify in your Stripe dashboard and click "Payment Complete" on the booking to release their account.`,
        );
      } else {
        await this.notifications.sendOwnerEmail(
          `Deposit Received — Booking #${bookingId}`,
          `${booking.clientName} paid a deposit for booking #${bookingId}. The booking is now confirmed.`,
        );
      }
      await this.bookingRepo.save(booking);
    }

    this.logger.log(`Payment ${paymentId} marked PAID for booking ${bookingId}`);
  }

  // ── Manual Payment Notification (Bank Transfer / Crypto) ──────────────────

  // Client calls this after making a bank transfer or crypto payment
  async notifyManualPayment(dto: {
    bookingId: number;
    clientName: string;
    clientPhone?: string;
    amountCents: number;
    paymentMethod: 'bank_transfer' | 'crypto' | 'card';
    reference?: string;
    isBalancePayment: boolean;
  }): Promise<PaymentNotification> {
    // IMPORTANT: Payment tab is only for balance/debt notifications — never deposits
    if (!dto.isBalancePayment) {
      throw new BadRequestException('Deposit payments do not require manual notification. Only balance payments are tracked here.');
    }

    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const notification = this.notificationRepo.create({
      bookingId: dto.bookingId,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      amountCents: dto.amountCents,
      paymentMethod: dto.paymentMethod,
      reference: dto.reference,
      status: NotificationStatus.PENDING,
    });
    const saved = await this.notificationRepo.save(notification);

    const methodLabel = dto.paymentMethod === 'bank_transfer' ? 'Bank Transfer'
      : dto.paymentMethod === 'crypto' ? 'Crypto Transfer' : 'Card (Stripe)';
    const amountLabel = `$${(dto.amountCents / 100).toFixed(2)}`;

    await this.notifications.sendOwnerEmail(
      `⚠️ Balance Payment Notified — Booking #${dto.bookingId}`,
      `${dto.clientName} has notified a ${methodLabel} balance payment of ${amountLabel} for booking #${dto.bookingId}.\n\n` +
      `Reference/Hash: ${dto.reference ?? 'Not provided'}\n` +
      `Phone: ${dto.clientPhone ?? 'Not provided'}\n\n` +
      `Please verify then click "Confirm & Release" in your admin Payments tab to unlock their account.`,
    );

    return saved;
  }

  // Admin fetches all pending manual payment notifications
  async getPendingNotifications() {
    return this.notificationRepo.find({
      where: { status: NotificationStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  // Admin fetches all notifications (pending + confirmed + rejected)
  async getAllNotifications() {
    return this.notificationRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // Admin confirms manual payment — clears client's owing status
  async confirmNotification(notificationId: number, adminNote?: string): Promise<{ notification: PaymentNotification; booking: Booking }> {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found');

    notification.status = NotificationStatus.CONFIRMED;
    notification.confirmedAt = new Date();
    notification.adminNote = adminNote;
    await this.notificationRepo.save(notification);

    const booking = await this.bookingRepo.findOne({ where: { id: notification.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Balance paid in full — clear owing and mark booking as completed
    (booking as any).paymentStatus = 'completed';
    (booking as any).balanceCents = 0;
    booking.status = 'completed'; // ← booking moves to completed
    await this.bookingRepo.save(booking);

    await this.notifications.sendOwnerEmail(
      `✅ Balance Confirmed — Booking #${notification.bookingId}`,
      `You confirmed the balance payment from ${notification.clientName}. Their account has been released and booking marked completed.`,
    );

    return { notification, booking };
  }

  // Admin rejects — keeps client account locked, records the rejection
  async rejectNotification(notificationId: number, adminNote?: string): Promise<PaymentNotification> {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found');

    notification.status = NotificationStatus.REJECTED;
    notification.adminNote = adminNote ?? 'Payment not found. Please re-submit with correct reference.';
    await this.notificationRepo.save(notification);

    return notification;
  }
}