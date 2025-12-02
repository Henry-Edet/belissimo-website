import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { UserMessageDto } from './ai-message.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('message')
  async handleMessage(@Body() body: UserMessageDto) {
    return this.aiService.handleMessage(body.message, body.userId);
  }
}
