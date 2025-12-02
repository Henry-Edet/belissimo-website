import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';
import { ServicesService } from '../services/services.service';

type AiAction = 'NONE' | 'CREATE_BOOKING_AND_PAYMENT' | 'CANCEL_BOOKING';

interface AiData {
  serviceId?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  startAt?: string | null;
  bookingId?: number | null;
}

interface MemoryState {
  lastServiceId?: string | null;
  lastServiceName?: string | null;
  lastClientName?: string | null;
  lastClientPhone?: string | null;
  lastStartAt?: string | null;
  lastBookingId?: number | null;
}

const memoryStore = new Map<string, MemoryState>();

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
    private readonly servicesService: ServicesService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({ apiKey });
  }

  private getMemory(userId: string): MemoryState {
    if (!memoryStore.has(userId)) {
      memoryStore.set(userId, {});
    }
    return memoryStore.get(userId)!;
  }

  private saveMemory(userId: string, patch: Partial<MemoryState>) {
    const current = this.getMemory(userId);
    memoryStore.set(userId, { ...current, ...patch });
  }

  async handleMessage(message: string, userId = 'anonymous') {
    const memory = this.getMemory(userId);

    // 1) Fetch services from DB so AI knows names + durations + prices
    const services = await this.servicesService.findAll();
    const serviceListForAI = services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.priceCents / 100,
      depositPercentage: s.depositPercentage,
      durationMinutes: s.durationMinutes,
      description: s.description ?? '',
    }));

    // 2) System prompt – full receptionist brain
    const systemPrompt = `
You are Bellissimo Hair Studio’s AI receptionist.

You:
- Know all services, durations and prices.
- Have MULTI-TURN MEMORY based on the "currentMemory" object.
- Can BOOK appointments + trigger deposits.
- Can CANCEL existing appointments.
- Can handle corrections like "actually make it 2 pm".
- Can answer general hair and service questions.

SERVICES:
${JSON.stringify(serviceListForAI, null, 2)}

CURRENT MEMORY (for this user):
${JSON.stringify(memory, null, 2)}

VERY IMPORTANT:
You MUST always respond with VALID JSON ONLY, using this exact shape:

{
  "reply": "what you say to the user",
  "action": "NONE" | "CREATE_BOOKING_AND_PAYMENT" | "CANCEL_BOOKING",
  "data": {
    "serviceId": "uuid-or-null",
    "clientName": "string-or-null",
    "clientPhone": "string-or-null",
    "startAt": "ISO-8601 datetime string-or-null",
    "bookingId": number-or-null
  }
}

BEHAVIOUR RULES:

1) GENERAL QUESTIONS
- If user is just asking about prices, duration, recommendations, aftercare, etc → set "action": "NONE".
- Answer naturally in "reply".

2) BOOKING FLOW
- If user clearly wants to book:
  - Detect service NAME and map it to the correct service id from the SERVICES list.
  - Use memory to fill missing fields when user says things like "same as before" or "actually make it 2pm".
  - Ask follow-up questions if some fields are missing.
  - Only when you have serviceId, clientName, clientPhone, startAt → set "action": "CREATE_BOOKING_AND_PAYMENT".

3) CANCELLATION FLOW
- If user wants to cancel:
  - If they mention a booking ID or reference, put it in data.bookingId.
  - Otherwise, ask for enough info (phone + date/time) and THEN set "action": "CANCEL_BOOKING" when clear.
  - reply should clearly confirm what is being cancelled.

4) MEMORY
- Always fill "data" with as much as you can infer.
- If user corrects something ("actually", "change it to", etc), override the previous values from memory.
- The backend will merge this "data" into memory on each turn.

Never expose raw UUIDs or internal IDs in the reply unless user explicitly asks.
Speak like a friendly, professional stylist / receptionist.
`.trim();

    // 3) Call OpenAI
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = completion.choices[0].message.content ?? '';
    let parsed: { reply?: string; action?: AiAction; data?: AiData };

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error('AI returned invalid JSON', err as any);
      return {
        reply:
          "Sorry, I didn’t quite get that. Could you say it again a bit more clearly?",
        action: 'NONE' as AiAction,
      };
    }

    const replyFromAI = parsed.reply ?? '';
    const action: AiAction = parsed.action ?? 'NONE';
    const data: AiData = parsed.data ?? {};

    // 4) Merge memory with new data
    const merged: MemoryState = {
      lastServiceId: data.serviceId ?? memory.lastServiceId ?? null,
      lastClientName: data.clientName ?? memory.lastClientName ?? null,
      lastClientPhone: data.clientPhone ?? memory.lastClientPhone ?? null,
      lastStartAt: data.startAt ?? memory.lastStartAt ?? null,
      lastBookingId: data.bookingId ?? memory.lastBookingId ?? null,
      lastServiceName: memory.lastServiceName ?? null, // optional label
    };

    this.saveMemory(userId, merged);

    // 5) If AI says "NONE", we’re just chatting
    if (action === 'NONE') {
      return {
        reply: replyFromAI || "Okay, let me know what you'd like to do next.",
        action: 'NONE',
      };
    }

    // 6) Handle booking creation
    if (action === 'CREATE_BOOKING_AND_PAYMENT') {
      const { lastServiceId, lastClientName, lastClientPhone, lastStartAt } =
        merged;

      if (!lastServiceId || !lastClientName || !lastClientPhone || !lastStartAt) {
        return {
          reply:
            "I almost have your booking ready. Please confirm the service, your name, phone number, and exact date & time.",
          action: 'NONE',
        };
      }

      let start: Date;
      try {
        start = new Date(lastStartAt);
        if (isNaN(start.getTime())) {
          throw new Error();
        }
      } catch {
        throw new BadRequestException('Invalid startAt date format from AI');
      }

      const booking = await this.bookingsService.create({
        serviceId: lastServiceId,
        clientName: lastClientName,
        clientPhone: lastClientPhone,
        startAt: start,
      } as any);

      // remember booking id
      this.saveMemory(userId, { lastBookingId: booking.id });

      const payment = await this.paymentsService.createCheckoutSession(
        booking.id,
      );

      return {
        reply:
          replyFromAI +
          `\n\nYour booking ID is: ${booking.id}\nDeposit link: ${payment.url}`,
        action: 'CREATE_BOOKING_AND_PAYMENT',
        bookingId: booking.id,
        paymentUrl: payment.url,
      };
    }

    // 7) Handle cancellation
    if (action === 'CANCEL_BOOKING') {
      const bookingId =
        data.bookingId ??
        merged.lastBookingId ??
        null;

      if (!bookingId) {
        return {
          reply:
            "I can cancel an appointment for you, but I need either your booking ID or the phone number and date/time used for the booking.",
          action: 'NONE',
        };
      }

      try {
        const cancelled = await this.bookingsService.cancelBooking(bookingId);
        this.saveMemory(userId, { lastBookingId: cancelled.id });

        return {
          reply:
            replyFromAI ||
            `Your appointment with ID ${cancelled.id} has been cancelled. If you’d like to rebook, I can help with that too.`,
          action: 'CANCEL_BOOKING',
          bookingId: cancelled.id,
        };
      } catch (err) {
        this.logger.error('Error cancelling booking', err as any);
        return {
          reply:
            "I couldn’t find that booking to cancel. Please double-check the booking ID or details.",
          action: 'NONE',
        };
      }
    }

    // 8) Fallback
    return {
      reply: replyFromAI || "Got it. Let me know what you'd like next.",
      action: 'NONE',
    };
  }
}
