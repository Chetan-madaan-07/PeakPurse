import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ChatSession, ChatTurn } from './chat-session.entity';
import { SendMessageDto, ChatResponseDto } from './chatbot.dto';
import { TransactionService } from '../services/transaction.service';

const MAX_TURNS = 10;

const INVESTMENT_KEYWORDS = ['invest', 'mutual fund', 'sip', 'elss', 'nps', 'stock', 'equity', 'portfolio', 'returns'];
const TAX_KEYWORDS = ['tax', 'itr', 'deduction', '80c', '80d', 'tds', 'income tax', 'filing'];
const DATA_KEYWORDS = ['my spending', 'my transactions', 'my budget', 'my savings', 'how much did i', 'what did i spend', 'my health score', 'my income', 'my expenses', 'afford'];

const SYSTEM_INSTRUCTION = `You are PeakBot, a friendly and knowledgeable financial assistant for Indian users on the PeakPurse platform.

Your capabilities:
- Answer general personal finance questions (budgeting, saving, investing, taxes in India)
- When user financial data is provided in context, analyze it and give personalized insights
- Provide guidance on Indian tax deductions (80C, 80D, 80CCD) in educational terms

Rules:
1. Respond concisely and friendly. Under 150 words unless detail is requested.
2. For investment advice: add "⚠️ Disclaimer: Educational info only. Consult a SEBI-registered RIA."
3. For tax advice: add "⚠️ Disclaimer: Educational info only. Consult a CA or ERI for official filing."
4. Never fabricate transaction data. Only use data explicitly provided in context.
5. Use INR (₹), refer to Indian banks, UPI, and Indian financial regulations.
6. For non-finance questions: "I'm specialized in personal finance. Let me help you with your money matters!"`;

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private genAI: GoogleGenAI | null = null;

  constructor(
    @InjectRepository(ChatSession)
    private sessionRepository: Repository<ChatSession>,
    private configService: ConfigService,
    private transactionService: TransactionService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      this.logger.warn('GEMINI_API_KEY not set. Chatbot will return fallback responses.');
    } else {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  async sendMessage(dto: SendMessageDto, userId?: string): Promise<ChatResponseDto> {
    // Load or create session — scope to user if logged in
    let session = dto.session_id
      ? await this.sessionRepository.findOne({ where: { id: dto.session_id } })
      : null;

    if (!session) {
      session = this.sessionRepository.create({ turns: [], user_id: userId || null });
      session = await this.sessionRepository.save(session);
    }

    const recentTurns = session.turns.slice(-MAX_TURNS);
    const intent = this.detectIntent(dto.message);
    const requiresUserData = this.requiresPersonalData(dto.message);

    // If question needs personal data but user isn't logged in
    if (requiresUserData && !userId) {
      const reply = "🔒 This question requires access to your financial data. Please **log in** to get a personalized answer!";
      return {
        session_id: session.id,
        reply,
        intent,
        turns_count: session.turns.length,
      };
    }

    // Build financial context only for logged-in users
    const financialContext = userId ? await this.buildFinancialContext() : '';

    let reply: string;
    if (!this.genAI) {
      reply = this.getFallbackResponse();
    } else {
      reply = await this.callGemini(dto.message, recentTurns, financialContext);
    }

    const disclaimer = this.getDisclaimer(intent);
    if (disclaimer && !reply.includes('Disclaimer')) {
      reply = `${reply}\n\n${disclaimer}`;
    }

    const newTurns: ChatTurn[] = [
      ...session.turns,
      { role: 'user', text: dto.message, timestamp: new Date().toISOString() },
      { role: 'model', text: reply, timestamp: new Date().toISOString() },
    ];

    session.turns = newTurns.slice(-(MAX_TURNS * 2));
    await this.sessionRepository.save(session);

    this.logger.log(`Chat [${session.id}] user:${userId || 'guest'} intent:${intent}`);

    return {
      session_id: session.id,
      reply,
      intent,
      disclaimer: disclaimer || undefined,
      turns_count: session.turns.length,
    };
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessionRepository.findOne({ where: { id: sessionId } });
  }

  async clearSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (session) {
      session.turns = [];
      await this.sessionRepository.save(session);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async callGemini(userMessage: string, history: ChatTurn[], financialContext: string): Promise<string> {
    // Prepend system instruction as first user/model exchange (works across all API versions)
    const systemTurn = [
      { role: 'user', parts: [{ text: `[System] ${SYSTEM_INSTRUCTION}` }] },
      { role: 'model', parts: [{ text: 'Understood. I am PeakBot, ready to help with personal finance questions.' }] },
    ];

    const contents = [
      ...systemTurn,
      ...history.map(turn => ({
        role: turn.role === 'model' ? 'model' : 'user',
        parts: [{ text: turn.text }],
      })),
      {
        role: 'user',
        parts: [{
          text: financialContext
            ? `[User's Financial Data]\n${financialContext}\n\n[Question]\n${userMessage}`
            : userMessage,
        }],
      },
    ];

    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-flash-lite-latest'];
    let lastError: any;

    for (const model of models) {
      try {
        const response = await this.genAI.models.generateContent({
          model,
          contents,
          config: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });
        this.logger.log(`Gemini responded using model: ${model}`);
        return response.text;
      } catch (error) {
        const msg: string = error?.message || JSON.stringify(error);
        lastError = error;

        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          this.logger.warn(`Model ${model} quota exhausted, trying next...`);
          continue; // try next model
        }

        // Non-quota error — don't retry
        this.logger.error('Gemini API error', msg);
        if (msg.includes('503')) {
          throw { code: 'ML_SERVICE_UNAVAILABLE', message: 'PeakBot is resting. Try again in a minute.' };
        }
        throw error;
      }
    }

    // All models exhausted
    this.logger.error('All Gemini models quota exhausted');
    throw { code: 'ML_SERVICE_UNAVAILABLE', message: 'PeakBot is temporarily unavailable due to API limits. Please try again later.' };
  }

  private async buildFinancialContext(): Promise<string> {
    try {
      const stats = await this.transactionService.getTransactionStats();
      if (stats.totalTransactions === 0) return '';

      const categoryBreakdown = await this.transactionService.getSpendingByCategory();
      const topCategories = categoryBreakdown
        .slice(0, 5)
        .map(c => `  - ${c.category}: ₹${Math.abs(c.total).toLocaleString('en-IN')} (${c.count} txns)`)
        .join('\n');

      return [
        `Total transactions: ${stats.totalTransactions}`,
        `Total spent: ₹${stats.totalSpent.toLocaleString('en-IN')}`,
        `Total income: ₹${stats.totalIncome.toLocaleString('en-IN')}`,
        `Average transaction: ₹${stats.averageTransaction.toFixed(2)}`,
        `Top spending categories:\n${topCategories}`,
      ].join('\n');
    } catch {
      return '';
    }
  }

  private requiresPersonalData(message: string): boolean {
    const lower = message.toLowerCase();
    return DATA_KEYWORDS.some(k => lower.includes(k));
  }

  private detectIntent(message: string): string {
    const lower = message.toLowerCase();
    if (INVESTMENT_KEYWORDS.some(k => lower.includes(k))) return 'investment';
    if (TAX_KEYWORDS.some(k => lower.includes(k))) return 'tax';
    if (lower.includes('budget') || lower.includes('spend')) return 'budget';
    if (lower.includes('goal') || lower.includes('saving')) return 'goal';
    if (lower.includes('health score')) return 'health_score';
    if (lower.includes('afford')) return 'affordability';
    if (lower.includes('subscription') || lower.includes('recurring')) return 'subscription';
    return 'general';
  }

  private getDisclaimer(intent: string): string | null {
    if (intent === 'investment') return '⚠️ Disclaimer: Educational info only. Consult a SEBI-registered RIA.';
    if (intent === 'tax') return '⚠️ Disclaimer: Educational info only. Consult a CA or ERI for official filing.';
    return null;
  }

  private getFallbackResponse(): string {
    return "I'm PeakBot! My AI brain isn't configured yet (GEMINI_API_KEY missing). I can still answer general finance questions once the key is set!";
  }
}
