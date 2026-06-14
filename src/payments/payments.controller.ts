// src/payments/payments.controller.ts

import {
  Controller, Post, Get, Patch, Body, Param,
  Req, Res, HttpCode, Logger, UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';
import { Role } from '../users/user.entity';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  // POST /payments/create-session — deposit on new booking
  @Post('create-session')
  async createSession(@Body() body: { bookingId: number }) {
    return this.paymentsService.createCheckoutSession(body.bookingId);
  }

  // POST /payments/balance-session — charge exact outstanding balance
  @Post('balance-session')
  async createBalanceSession(@Body() body: { bookingId: number }) {
    return this.paymentsService.createBalanceCheckoutSession(body.bookingId);
  }

  // POST /payments/webhook — Stripe webhook
  @HttpCode(200)
  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET missing');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.paymentsService.handleStripeCheckoutCompleted(session);
    }

    return res.json({ received: true });
  }

  // ── Manual Payments (Bank Transfer / Crypto) ──────────────────────────────

  // POST /payments/notify-deposit
  // Client sent deposit proof via bank/crypto — email admin only
  // Does NOT create a PaymentNotification record (deposits don't appear in Payments tab)
  @Post('notify-deposit')
  @UseGuards(JwtOptionalGuard)
  async notifyDeposit(@Body() body: {
    bookingId: number;
    clientName: string;
    clientPhone?: string;
    amountCents: number;
    paymentMethod: 'bank_transfer' | 'crypto';
  }) {
    return this.paymentsService.notifyDepositEmail(body);
  }
  // ONLY for balance payments — deposits never create notifications
  @Post('notify')
  @UseGuards(JwtOptionalGuard)
  async notifyPayment(@Body() body: {
    bookingId: number;
    clientName: string;
    clientPhone?: string;
    amountCents: number;
    paymentMethod: 'bank_transfer' | 'crypto' | 'card';
    reference?: string;
    isBalancePayment: boolean;
  }) {
    return this.paymentsService.notifyManualPayment(body);
  }

  // POST /payments/notify-stripe-balance
  // Client taps "Notify Admin" on Stripe confirmation screen after paying balance via card
  @Post('notify-stripe-balance')
  @UseGuards(JwtOptionalGuard)
  async notifyStripeBalance(@Body() body: {
    bookingId: number;
    clientName: string;
    amountCents: number;
  }) {
    return this.paymentsService.notifyManualPayment({
      bookingId: body.bookingId,
      clientName: body.clientName,
      amountCents: body.amountCents,
      paymentMethod: 'card',
      isBalancePayment: true,
      reference: 'Stripe payment — auto-notified',
    });
  }

  // GET /payments/notifications — admin sees all pending manual payments
  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getNotifications() {
    return this.paymentsService.getAllNotifications();
  }

  // PATCH /payments/notifications/:id/confirm
  // Admin confirms payment received — releases client account
  @Patch('notifications/:id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async confirmNotification(
    @Param('id') id: string,
    @Body() body: { adminNote?: string },
  ) {
    return this.paymentsService.confirmNotification(parseInt(id), body.adminNote);
  }

  // PATCH /payments/notifications/:id/reject
  // Admin rejects — keeps account locked
  @Patch('notifications/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectNotification(
    @Param('id') id: string,
    @Body() body: { adminNote?: string },
  ) {
    return this.paymentsService.rejectNotification(parseInt(id), body.adminNote);
  }
}