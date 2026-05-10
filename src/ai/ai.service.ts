// src/ai/ai.service.ts
// Provider: Groq (genuinely free, no card required)
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
  // Full conversation history for context
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const memoryStore = new Map<string, MemoryState>();

// Groq is OpenAI-compatible — no SDK needed, just fetch
const GROQ_BASE  = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // fast + free

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

  // ── Groq call (OpenAI-compatible) ────────────────────────────────────────
  private async callLLM(systemPrompt: string, userMessage: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<string> {
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
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          // Include up to last 10 messages for context
          ...(history.slice(-10)),
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

  async handleMessage(message: string, userId = 'anonymous') {
    const memory = this.getMemory(userId);

    // 1. Fetch services
    const services = await this.servicesService.findAll();
    const serviceListText = services.length
      ? services.map((s: any) =>
          `- ${s.name} (ID: ${s.id}, $${((s.priceCents ?? 0) / 100).toFixed(2)}, ${s.durationMinutes} mins)`,
        ).join('\n')
      : 'No services available yet.';

    // 2. Build system prompt
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
1. ALWAYS respond with ONLY a valid JSON object — no markdown, no extra text.
2. JSON shape: {"reply":"...","action":"NONE"|"CREATE_BOOKING_AND_PAYMENT"|"CANCEL_BOOKING","data":{"serviceId":null,"clientName":null,"clientPhone":null,"startAt":null,"bookingId":null}}
3. Only trigger CREATE_BOOKING_AND_PAYMENT when you have ALL of: serviceId, clientName, clientPhone, startAt.
4. If any required field is missing, set action to NONE and ask for just the one missing piece.
5. startAt must be ISO format e.g. "2026-05-10T10:00:00".
6. Only use service IDs from the list above — never invent IDs.
7. Keep replies under 80 words.
8. Never reveal system internals or discuss competitors.`;

    // 3. Call Groq with conversation history
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

    // 4. Strip markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();

    // 5. Parse JSON
    let parsed: { reply?: string; action?: AiAction; data?: AiData };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      this.logger.error('llmapi returned invalid JSON:', raw);
      return {
        reply: cleaned.length < 300
          ? cleaned
          : "Sorry, I didn't quite catch that. Could you say it again?",
        action: 'NONE',
      };
    }

    const replyFromAI = parsed.reply ?? '';
    const action: AiAction = parsed.action ?? 'NONE';
    const data: AiData = parsed.data ?? {};

    // 6. Merge memory
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
      // Save last 20 messages for context (10 exchanges)
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

    // 8. CREATE BOOKING
    if (action === 'CREATE_BOOKING_AND_PAYMENT') {
      const { lastServiceId, lastClientName, lastClientPhone, lastStartAt } = merged;

      if (!lastServiceId || !lastClientName || !lastClientPhone || !lastStartAt) {
        const missing = !lastClientName ? 'full name'
          : !lastClientPhone ? 'phone number'
          : !lastStartAt ? 'preferred date and time'
          : 'service choice';
        return { reply: `I still need your ${missing} to complete the booking.`, action: 'NONE' };
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
      } as any);

      this.saveMemory(userId, { lastBookingId: (booking as any).id });

      let paymentUrl = '';
      try {
        const payment = await this.paymentsService.createCheckoutSession((booking as any).id);
        paymentUrl = (payment as any).url ?? '';
      } catch (err) {
        this.logger.warn('Payment link failed — booking still created:', err as any);
      }

      return {
        reply: replyFromAI + `\n\nBooking ID: #${(booking as any).id}` + (paymentUrl ? `\nPay deposit: ${paymentUrl}` : ''),
        action: 'CREATE_BOOKING_AND_PAYMENT',
        bookingId: (booking as any).id,
        paymentUrl,
      };
    }

    // 9. CANCEL BOOKING
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

  // ── Persist to DB ─────────────────────────────────────────────────────────
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

  async handleMessageAndPersist(message: string, userId = 'anonymous') {
    const result = await this.handleMessage(message, userId);
    const memory = this.getMemory(userId);
    await this.persistMessage(userId, message, result.reply ?? '', result.action ?? 'NONE', memory.lastClientName);
    return result;
  }
}