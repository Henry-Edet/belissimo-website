import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
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
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });
  }

  @Post('create-session')
  async createSession(@Body() body: { bookingId: number }) {
    return this.paymentsService.createCheckoutSession(body.bookingId);
  }

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
      const rawBody = (req as any).rawBody;
// console.log({rawBody : req.body,
//         sig,
//         webhookSecret})
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret,
      );
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
}
