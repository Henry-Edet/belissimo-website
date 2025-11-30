import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('message')
  async message(@Body() dto: ChatMessageDto) {
    const reply = await this.chat.respond(dto.message, dto.userId);
    return { reply };
  }
}
