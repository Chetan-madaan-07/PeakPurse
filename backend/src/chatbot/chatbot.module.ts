import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './chat-session.entity';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, Transaction]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, TransactionService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
