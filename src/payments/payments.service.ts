import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Booking } from '../bookings/booking.entity';
import { Payment, PaymentStatus } from './payment.entity';
import { Service } from '../services/service.entity';
import { ConfigService } from '@nestjs/config';

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

    private config: ConfigService,
  ) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secret, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });
  }

  async createCheckoutSession(bookingId: number) {
    // Fetch booking
    const booking = await this.bookingRepo.findOne({
      where: { id: (bookingId) },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Fetch service
    const service = await this.serviceRepo.findOne({
      where: { id: String(booking.serviceId) },
    });
    if (!service) throw new NotFoundException('Service not found');

    // ---------------------------------------------
    // FIXED: Correct deposit calculation
    // ---------------------------------------------
    const totalPriceCents = service.priceCents; // integer already in cents
    const depositPct = service.depositPercentage ?? 30;

    const amountCents = Math.round(totalPriceCents * (depositPct / 100));

    if (amountCents <= 0) {
      throw new BadRequestException('Invalid deposit amount');
    }

    // Create payment record
    const payment = this.paymentsRepo.create({
      bookingId,
      amountCents,
      currency: 'TRY',
      provider: 'stripe',
      status: PaymentStatus.PENDING,
    });

    const saved = await this.paymentsRepo.save(payment);

    // Create Stripe session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'try',
            product_data: { name: `Deposit for ${service.name}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
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

  async handleStripeCheckoutCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};
    const paymentId = Number(metadata.paymentId || null);
    const bookingId = Number(metadata.bookingId || null);

    let payment: Payment | null = null;

    if (paymentId) {
      payment = await this.paymentsRepo.findOne({
        where: { id: String(paymentId) },
      });
    }

    if (!payment && bookingId) {
      payment = await this.paymentsRepo.findOne({
        where: { bookingId },
      });
    }

    if (!payment) {
      this.logger.warn(`Payment not found for Stripe session ${session.id}`);
      return;
    }

    payment.status = PaymentStatus.PAID;
    payment.providerId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || session.id;

    await this.paymentsRepo.save(payment);

    const booking = await this.bookingRepo.findOne({
      where: { id: (payment.bookingId) },
    });

    if (booking) {
      booking.status = 'confirmed';
      await this.bookingRepo.save(booking);
    }

    this.logger.log(`Payment ${payment.id} marked PAID for booking ${payment.bookingId}`);
  }
}
