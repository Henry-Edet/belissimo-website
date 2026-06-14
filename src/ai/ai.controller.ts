// src/ai/ai.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { UserMessageDto } from './ai-message.dto';
import { takenOverSessions } from '../admin/admin.service';
import { ChatMessage, MessageSender } from '../chat/chat-message.entity';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
  ) {}

  @Post('message')
  async handleMessage(@Body() body: UserMessageDto) {
    const userId = body.userId ?? 'anonymous';
    const clientName = body.clientName ?? null;
    const message = body.message ?? '';

    // Check if client wants to speak to a human
    const wantsHuman = /\b(human|agent|person|real person|speak to someone|talk to someone|staff|manager|stylist|help me|urgent)\b/i.test(message);

    // If admin has taken over — save client message so admin can see it, then stay quiet
    if (takenOverSessions.has(userId)) {
      // Persist client message to DB so admin sees it in the session
      await this.chatRepo.save(this.chatRepo.create({
        sessionId: userId,
        clientName: clientName ?? undefined,
        sender: MessageSender.USER,
        message,
        flaggedForTakeover: true,
        adminTakenOver: true,
      }));
      // Return empty — no Bella response while admin is in control
      return {
        reply: null,
        action: 'NONE',
        takenOver: true,
      };
    }

    // Normal flow — let Bella handle
    const result = await this.aiService.handleMessageAndPersist(message, userId, clientName);

    // If client wants human, flag the session for admin attention
    if (wantsHuman) {
      await this.chatRepo
        .createQueryBuilder()
        .update(ChatMessage)
        .set({ flaggedForTakeover: true })
        .where('session_id = :userId', { userId })
        .execute();

      // Override Bella's reply to let client know
      return {
        ...result,
        reply: "I completely understand! Let me connect you with one of our team members right away. 💛 Please hold on — a Bellissimo stylist will be with you shortly.",
        flaggedForAdmin: true,
      };
    }

    return result;
  }
}