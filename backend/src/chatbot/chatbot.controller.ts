import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus, HttpException, UseGuards, Request, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto, ChatResponseDto } from './chatbot.dto';

// Optional JWT guard — doesn't reject unauthenticated requests, just populates req.user if token present
class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user || null; // return null instead of throwing for missing/invalid token
  }
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @UseGuards(OptionalJwtGuard)
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto, @Request() req): Promise<ChatResponseDto> {
    try {
      const userId = req.user?.id || null;
      return await this.chatbotService.sendMessage(dto, userId);
    } catch (error) {
      if (error.code === 'ML_SERVICE_UNAVAILABLE') {
        throw new HttpException(
          { error: { code: error.code, message: error.message } },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        { error: { code: 'CHATBOT_ERROR', message: error?.message || 'Failed to process your message. Please try again.' } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:id')
  async getSession(@Param('id') id: string) {
    const session = await this.chatbotService.getSession(id);
    if (!session) {
      throw new HttpException(
        { error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found.' } },
        HttpStatus.NOT_FOUND,
      );
    }
    return session;
  }

  @Delete('session/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearSession(@Param('id') id: string): Promise<void> {
    await this.chatbotService.clearSession(id);
  }
}
