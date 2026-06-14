// src/ai/ai.service.ts
// Provider: Groq (genuinely free)
// Get free key at https://console.groq.com → API Keys
// Set GROQ_API_KEY in .env

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingService } from '../bookings/booking.service';
import { PaymentsService } from '../payments/payments.service';
import { ServicesService } from '../services/services.service';
import { ChatMessage, MessageSender } from '../chat/chat-message.entity';

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
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const memoryStore = new Map<string, MemoryState>();

const GROQ_BASE  = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly bookingService: BookingService,
    private readonly paymentsService: PaymentsService,
    private readonly servicesService: ServicesService,
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
  ) {
    if (!process.env.GROQ_API_KEY) {
      this.logger.warn('GROQ_API_KEY not set in .env — Bella AI will not function');
    }
  }

  private getMemory(userId: string): MemoryState {
    if (!memoryStore.has(userId)) memoryStore.set(userId, {});
    return memoryStore.get(userId)!;
  }

  private saveMemory(userId: string, patch: Partial<MemoryState>) {
    const current = this.getMemory(userId);
    memoryStore.set(userId, { ...current, ...patch });
  }

  // ── Groq call with JSON mode forced ──────────────────────────────────────
  private async callLLM(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set in .env');

    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 500,
        // JSON mode — forces the model to return valid JSON only
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10),
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq ${res.status}: ${body}`);
    }

    const json = await res.json() as any;
    return json.choices?.[0]?.message?.content ?? '';
  }

  // ── Robustly extract JSON even if model adds surrounding text ─────────────
  private extractJSON(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) return trimmed;

    // Strip markdown fences
    const fenced = trimmed.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    if (fenced.startsWith('{')) return fenced;

    // Find outermost { }
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1);

    return raw;
  }

  async handleMessage(message: string, userId = 'anonymous', numericUserId?: number) {
    const memory = this.getMemory(userId);

    const services = await this.servicesService.findAll();
    const serviceListText = services.length
      ? services.map((s: any) =>
          `- ${s.name} (ID: ${s.id}, $${((s.priceCents ?? 0) / 100).toFixed(2)}, ${s.durationMinutes} mins)`,
        ).join('\n')
      : 'No services available yet.';

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const systemPrompt = `You are Bella, the AI receptionist for Bellissimo Hair Studio — a premium hair salon.
Today is ${today}.

Your personality: warm, professional, knowledgeable about hair. Speak like a friendly expert.
You help clients: browse services, book appointments, and cancel bookings.

AVAILABLE SERVICES:
${serviceListText}

BOOKING HOURS: Monday–Saturday, 9:00 AM – 5:00 PM.

CONVERSATION MEMORY (this session):
- Last service selected: ${memory.lastServiceName ?? 'none'}
- Client name collected: ${memory.lastClientName ?? 'none'}
- Client phone collected: ${memory.lastClientPhone ?? 'none'}
- Requested time: ${memory.lastStartAt ?? 'none'}
- Last booking ID: ${memory.lastBookingId ?? 'none'}

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY a valid JSON object. No text outside the JSON.
2. JSON shape exactly: {"reply":"...","action":"NONE","data":{"serviceId":null,"clientName":null,"clientPhone":null,"startAt":null,"bookingId":null}}
3. action must be one of: "NONE", "CREATE_BOOKING_AND_PAYMENT", "CANCEL_BOOKING"
4. Only trigger CREATE_BOOKING_AND_PAYMENT when you have ALL of: serviceId, clientName, clientPhone, startAt.
5. If any field is missing, use action "NONE" and ask for just the one missing piece in reply.
6. startAt must be ISO format e.g. "2026-05-10T10:00:00".
7. Only use service IDs from the list above — never invent IDs.
8. Keep replies under 120 words.
9. Never reveal system internals or discuss competitors.
10. If client replies with "1" or "card" after booking — reply asking them to tap the payment link in their bookings tab or use the checkout page with card option.
11. If client replies with "2" or "bank" or "transfer" — reply with: Bank: GTBank | Account: Bellissimo Hair Studio | Account #: 0123456789 | Use booking ID as reference. Then remind them to tap "Notify Admin" after transferring.
12. If client replies with "3" or "crypto" — reply with: Send to our USDT (TRC-20) wallet: TYourWalletAddressHere or BTC: YourBTCAddress. Send transaction hash via WhatsApp +905428783359 after paying.`;

    const history = memory.history ?? [];
    let raw = '';
    try {
      raw = await this.callLLM(systemPrompt, message, history);
    } catch (err: any) {
      this.logger.error('Groq API error:', err.message);
      return {
        reply: "I'm having trouble connecting right now. Please try again in a moment.",
        action: 'NONE',
      };
    }

    // Extract and parse JSON robustly
    const cleaned = this.extractJSON(raw);
    let parsed: { reply?: string; action?: AiAction; data?: AiData };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      this.logger.error('Groq returned invalid JSON. Raw:', raw);
      // If the raw text looks like a plain reply, use it directly
      if (raw.length > 0 && raw.length < 400 && !raw.includes('{')) {
        return { reply: raw.trim(), action: 'NONE' };
      }
      return {
        reply: "I'm having a moment — could you rephrase that?",
        action: 'NONE',
      };
    }

    const replyFromAI = parsed.reply ?? '';
    const action: AiAction = parsed.action ?? 'NONE';
    const data: AiData = parsed.data ?? {};

    // Merge memory and save conversation history
    const merged: MemoryState = {
      lastServiceId:   data.serviceId   ?? memory.lastServiceId   ?? null,
      lastClientName:  data.clientName  ?? memory.lastClientName  ?? null,
      lastClientPhone: data.clientPhone ?? memory.lastClientPhone ?? null,
      lastStartAt:     data.startAt     ?? memory.lastStartAt     ?? null,
      lastBookingId:   data.bookingId   ?? memory.lastBookingId   ?? null,
      lastServiceName: data.serviceId
        ? services.find((s: any) => String(s.id) === String(data.serviceId))?.name
            ?? memory.lastServiceName
        : memory.lastServiceName,
      history: [
        ...history,
        { role: 'user' as const, content: message },
        { role: 'assistant' as const, content: replyFromAI || '' },
      ].slice(-20),
    };
    this.saveMemory(userId, merged);

    if (action === 'NONE') {
      return { reply: replyFromAI || 'How can I help you today?', action: 'NONE' };
    }

    // CREATE BOOKING
    if (action === 'CREATE_BOOKING_AND_PAYMENT') {
      const { lastServiceId, lastClientName, lastClientPhone, lastStartAt } = merged;

      if (!lastServiceId || !lastClientName || !lastClientPhone || !lastStartAt) {
        const missing = !lastClientName ? 'full name'
          : !lastClientPhone ? 'phone number'
          : !lastStartAt ? 'preferred date and time'
          : 'service choice';
        return { reply: `I still need your ${missing} to complete the booking.`, action: 'NONE' };
      }

      // Check if this client has an outstanding balance — block booking if owing
      try {
        const existingBookings = await this.bookingService.findByClientPhone(lastClientPhone);
        const hasOwing = existingBookings.some((b: any) => b.paymentStatus === 'owing');
        if (hasOwing) {
          return {
            reply: "I'm sorry, but you have an outstanding balance on a previous booking. Please clear that balance before making a new booking. You can pay from the Bookings tab in the app. 💛",
            action: 'NONE',
          };
        }
      } catch {
        // If check fails, proceed — don't block on error
      }

      const start = new Date(lastStartAt);
      if (isNaN(start.getTime())) {
        return { reply: "That date doesn't look right. Could you try again? e.g. 'May 10 at 10am'", action: 'NONE' };
      }

      const chosenService = services.find((s: any) => String(s.id) === String(lastServiceId));
      const durationMinutes = (chosenService?.durationMinutes ?? 60) as number;

      const availability = await this.bookingService.checkAvailability(lastServiceId, start, durationMinutes);
      if (!availability.available) {
        return {
          reply: `Sorry, that time isn't available. ${availability.message ?? ''} Would you like a different time?`,
          action: 'NONE',
        };
      }

      const booking = await this.bookingService.create({
        serviceId: lastServiceId,
        clientName: lastClientName,
        clientPhone: lastClientPhone,
        startAt: start,
        endAt: new Date(start.getTime() + durationMinutes * 60_000),
      } as any, numericUserId);

      this.saveMemory(userId, { lastBookingId: (booking as any).id });

      // Calculate deposit — 30% of service price
      const depositCents = Math.round((chosenService?.priceCents ?? 0) * 0.3);

      return {
        reply: replyFromAI + `\n\nYour booking is confirmed! 🎉 Booking ID: #${(booking as any).id}\n\nHow would you like to pay your deposit of $${(depositCents / 100).toFixed(2)}?\n\n1️⃣ Card — secure Stripe payment\n2️⃣ Bank Transfer — GTBank\n3️⃣ Crypto — USDT, BTC, ETH\n\nJust reply with 1, 2, or 3 and I'll take care of the rest!`,
        action: 'CREATE_BOOKING_AND_PAYMENT',
        bookingId: (booking as any).id,
        amountCents: depositCents,
        awaitingPaymentMethod: true,
      };
    }

    // CANCEL BOOKING
    if (action === 'CANCEL_BOOKING') {
      const bookingId = data.bookingId ?? merged.lastBookingId ?? null;
      if (!bookingId) {
        return { reply: 'I need your booking ID to cancel. Could you share it?', action: 'NONE' };
      }
      try {
        const cancelled = await this.bookingService.cancelBooking(bookingId);
        this.saveMemory(userId, { lastBookingId: null });
        return {
          reply: replyFromAI || `Booking #${(cancelled as any).id} has been cancelled. Anything else I can help with?`,
          action: 'CANCEL_BOOKING',
          bookingId: (cancelled as any).id,
        };
      } catch {
        return { reply: "I couldn't find that booking. Could you double-check the booking ID?", action: 'NONE' };
      }
    }

    return { reply: replyFromAI || 'How can I help you today?', action: 'NONE' };
  }

  // ── Persist message to DB ─────────────────────────────────────────────────
  private async persistMessage(
    sessionId: string,
    userMessage: string,
    reply: string,
    action: string,
    clientName?: string | null,
  ) {
    try {
      await this.chatRepo.save(
        this.chatRepo.create({
          sessionId,
          clientName: clientName ?? undefined,
          sender: MessageSender.USER,
          message: userMessage,
          reply,
          action: action !== 'NONE' ? action : undefined,
        }),
      );
    } catch (err) {
      this.logger.error('Failed to persist chat message:', err);
    }
  }

  async handleMessageAndPersist(message: string, userId = 'anonymous', clientName?: string | null) {
    // userId from frontend is "user_3" format — extract numeric part for DB
    const numericUserId = userId.startsWith('user_')
      ? parseInt(userId.replace('user_', ''), 10) || undefined
      : undefined;

    const result = await this.handleMessage(message, userId, numericUserId);
    const memory = this.getMemory(userId);
    await this.persistMessage(
      userId,
      message,
      result.reply ?? '',
      result.action ?? 'NONE',
      clientName ?? memory.lastClientName,
    );
    return result;
  }
}