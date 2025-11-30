import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    this.client = new OpenAI({ apiKey });
  }

  async handleMessage(message: string, userId?: string) {
    // 1) Ask model what to do, in a structured JSON format
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
I am Bellissimo Hair Studio's AI assistant.

Your job:
- Help clients understand services and pricing.
- Help them book appointments, but ONLY through the structured JSON format below.
- If you have enough info (service, date, time, name, phone), you may request booking creation and payment.
- If info is missing, ask follow-up questions and set action="NONE".

VERY IMPORTANT:
You must ALWAYS respond with valid JSON ONLY, no extra text, using this shape:

{
  "reply": "what you say to the user, natural language",
  "action": "NONE" | "CREATE_BOOKING_AND_PAYMENT",
  "data": {
    "serviceId": "uuid-or-null",
    "clientName": "string-or-null",
    "clientPhone": "string-or-null",
    "startAt": "ISO-8601 datetime string-or-null"
  }
}

Rules:
- If you are just chatting / answering questions, use action="NONE".
- If user clearly wants to book, and all fields are known, use action="CREATE_BOOKING_AND_PAYMENT".
- If you don't know the serviceId, set it to null and ask the user to pick a specific service.
- "startAt" must be a full ISO string like "2025-11-20T14:30:00Z".
        `.trim(),
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content ?? '';
    let parsed: {
      reply?: string;
      action?: 'NONE' | 'CREATE_BOOKING_AND_PAYMENT';
      data?: {
        serviceId?: string | null;
        clientName?: string | null;
        clientPhone?: string | null;
        startAt?: string | null;
      };
    };

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error('AI returned non-JSON, falling back', err as any);
      return {
        reply:
          "Sorry, I got a bit confused. Could you rephrase that? I'm still learning.",
        action: 'NONE',
      };
    }

    const action = parsed.action ?? 'NONE';
    const replyFromAI = parsed.reply ?? '';

    if (action === 'NONE') {
      // Pure chat mode, nothing to run on backend
      return {
        reply: replyFromAI || "Okay! Let me know how I can help with your hair booking.",
        action: 'NONE',
      };
    }

    if (action === 'CREATE_BOOKING_AND_PAYMENT') {
      const d = parsed.data || {};
      const { serviceId, clientName, clientPhone, startAt } = d;

      // Validate required fields – this is our safety net
      if (!serviceId || !clientName || !clientPhone || !startAt) {
        return {
          reply:
            "I don't have enough info to book you yet. Please tell me the exact service, your name, phone, and what date/time you want.",
          action: 'NONE',
        };
      }

      let start: Date;
      try {
        start = new Date(startAt);
        if (isNaN(start.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        throw new BadRequestException('Invalid startAt date format');
      }

      // 2) Call your existing booking logic
      const booking = await this.bookingsService.create({
        serviceId,
        clientName,
        clientPhone,
        startAt: start,
      } as any);

      // 3) Call your existing Stripe session logic
      const payment = await this.paymentsService.createCheckoutSession(
        booking.id,
      );

      const finalReply =
        replyFromAI ||
        `I’ve created a pending booking for you. Please pay your deposit using this link: ${payment.url}`;

      return {
        reply: `${finalReply}\n\nDeposit link: ${payment.url}`,
        action: 'CREATE_BOOKING_AND_PAYMENT',
        bookingId: booking.id,
        paymentUrl: payment.url,
      };
    }

    // Default fallback
    return {
      reply: replyFromAI || "Got it! Let me know what you'd like to do next.",
      action: 'NONE',
    };
  }
}
