import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiMessageDto } from './ai-message.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('respond')
  async respond(@Body() dto: AiMessageDto) {
    const result = await this.aiService.handleMessage(dto.message, dto.userId);
    return result;
  }
}
