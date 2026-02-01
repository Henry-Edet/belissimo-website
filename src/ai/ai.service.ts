// src/ai/ai.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { BookingService } from '../bookings/booking.service';
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
    private readonly bookingService: BookingService,
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

    // 1) Fetch services
    const services = await this.servicesService.findAll();
    const serviceListForAI = services.map((s: any) => ({
      id: s.id,
      name: s.name,
      price: (s.priceCents ?? 0) / 100,
      depositPercentage: s.depositPercentage,
      durationMinutes: s.durationMinutes,
      description: s.description ?? '',
    }));

    // 2) System prompt
    const systemPrompt = `
You are Bellissimo Hair Studio's AI receptionist.
[Your existing prompt remains the same]
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
        reply: "Sorry, I didn't quite get that. Could you say it again?",
        action: 'NONE' as AiAction,
      };
    }

    const replyFromAI = parsed.reply ?? '';
    const action: AiAction = parsed.action ?? 'NONE';
    const data: AiData = parsed.data ?? {};

    // 4) Merge memory
    const merged: MemoryState = {
      lastServiceId: data.serviceId ?? memory.lastServiceId ?? null,
      lastClientName: data.clientName ?? memory.lastClientName ?? null,
      lastClientPhone: data.clientPhone ?? memory.lastClientPhone ?? null,
      lastStartAt: data.startAt ?? memory.lastStartAt ?? null,
      lastBookingId: data.bookingId ?? memory.lastBookingId ?? null,
      lastServiceName: memory.lastServiceName ?? null,
    };

    this.saveMemory(userId, merged);

    // 5) If NONE action
    if (action === 'NONE') {
      return {
        reply: replyFromAI || "Okay, let me know what you'd like to do next.",
        action: 'NONE',
      };
    }

    // 6) Handle booking creation
    if (action === 'CREATE_BOOKING_AND_PAYMENT') {
      const { lastServiceId, lastClientName, lastClientPhone, lastStartAt } = merged;

      if (!lastServiceId || !lastClientName || !lastClientPhone || !lastStartAt) {
        return {
          reply: "I need service, your name, phone, and date/time to book.",
          action: 'NONE',
        };
      }

      let start: Date;
      try {
        start = new Date(lastStartAt);
        if (isNaN(start.getTime())) throw new Error();
      } catch {
        throw new BadRequestException('Invalid startAt date format');
      }

      // Find service details for duration (so you don't hardcode 60 mins)
      const chosenService = services.find((s: any) => String(s.id) === String(lastServiceId));
      const durationMinutes = (chosenService?.durationMinutes ?? 60) as number;

      // Check availability (prevents double booking)
      const availability = await this.bookingService.checkAvailability(
        lastServiceId,
        start,
        durationMinutes,
      );

      if (!availability.available) {
        return {
          reply: `Sorry, that time isn't available. ${availability.message || 'Try another time.'}`,
          action: 'NONE',
        };
      }

      // Create booking
      const endAt = new Date(start.getTime() + durationMinutes * 60_000);

      const booking = await this.bookingService.create({
        serviceId: lastServiceId,
        clientName: lastClientName,
        clientPhone: lastClientPhone,
        startAt: start,
        endAt,
      } as any);

      this.saveMemory(userId, { lastBookingId: (booking as any).id });

      // Create payment
      let paymentUrl = '';
      try {
        const payment = await this.paymentsService.createCheckoutSession((booking as any).id);
        paymentUrl = (payment as any).url;
      } catch (error) {
        this.logger.warn('Payment service error:', error as any);
      }

      return {
        reply:
          replyFromAI +
          `\n\nBooking ID: ${(booking as any).id}` +
          (paymentUrl ? `\nDeposit link: ${paymentUrl}` : ''),
        action: 'CREATE_BOOKING_AND_PAYMENT',
        bookingId: (booking as any).id,
        paymentUrl,
      };
    }

    // 7) Handle cancellation
    if (action === 'CANCEL_BOOKING') {
      const bookingId = data.bookingId ?? merged.lastBookingId ?? null;

      if (!bookingId) {
        return {
          reply: "I need your booking ID or details to cancel.",
          action: 'NONE',
        };
      }

      try {
        const cancelled = await this.bookingService.cancelBooking(bookingId);
        this.saveMemory(userId, { lastBookingId: (cancelled as any).id });

        return {
          reply: replyFromAI || `Appointment ${(cancelled as any).id} cancelled.`,
          action: 'CANCEL_BOOKING',
          bookingId: (cancelled as any).id,
        };
      } catch (err) {
        this.logger.error('Error cancelling booking', err as any);
        return {
          reply: "Couldn't find that booking. Check the ID/details.",
          action: 'NONE',
        };
      }
    }

    // 8) Fallback
    return {
      reply: replyFromAI || "Got it. What would you like next?",
      action: 'NONE',
    };
  }
}
