// src/ai/ai.controller.ts
// Checks if admin has taken over the session before calling Bella

import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { UserMessageDto } from './ai-message.dto';
import { takenOverSessions } from '../admin/admin.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('message')
  async handleMessage(@Body() body: UserMessageDto) {
    const userId = body.userId ?? 'anonymous';

    // If admin has taken over this session, Bella stays quiet
    if (takenOverSessions.has(userId)) {
      return {
        reply: "I've passed this to our team — a Bellissimo stylist will respond shortly. 💛",
        action: 'NONE',
        takenOver: true,
      };
    }

    return this.aiService.handleMessageAndPersist(body.message, userId);
  }
}