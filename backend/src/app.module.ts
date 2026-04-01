import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AppController } from './app.controller';
import { HealthController } from './controllers/health.controller';
import { FileUploadController } from './controllers/file-upload.controller';
import { TransactionController } from './controllers/transaction.controller';
import { InvestmentController } from './controllers/investment.controller';

// Services
import { FileUploadService } from './services/file-upload.service';
import { TransactionService } from './services/transaction.service';
import { InvestmentService } from './services/investment.service';
import { AuditService } from './services/audit.service';

// Entities — root level
import { Transaction } from './transaction.entity';
import { User } from './user.entity';
import { Goal } from './goal.entity';
import { InvestmentPlan } from './investment-plan.entity';
import { AuditLog } from './audit-log.entity';

// Entities — module level
import { ChatSession } from './chatbot/chat-session.entity';
import { Subscription } from './subscription/subscription.entity';
import { Notification } from './subscription/notification.entity';

import { TaxModule } from './tax/tax.module';
import { TaxProfile } from './tax/tax.entity';
import { AuthModule } from './auth/auth.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CaModule } from './ca/ca.module';
import { BenchmarkingModule } from './benchmarking/benchmarking.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';
        
        return {
          type: 'postgres',
          // Priority: Use DATABASE_URL if it exists (Render standard)
          url: process.env.DATABASE_URL,
          
          // Fallback to individual variables if DATABASE_URL is not present
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'peakpurse_user',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_DATABASE || 'peakpurse_dev',
          
          entities: [
            Transaction, User, Goal, InvestmentPlan, AuditLog,
            ChatSession, Subscription, Notification, TaxProfile,
          ],
          synchronize: process.env.DB_SYNCHRONIZE === 'true',
          logging: process.env.DB_LOGGING === 'true',
          
          // SSL is required for Render PostgreSQL in production
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          
          connectTimeoutMS: 30000,
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),

    TypeOrmModule.forFeature([Transaction, User, Goal, InvestmentPlan, AuditLog]),

    AuthModule,
    ChatbotModule,
    CaModule,
    BenchmarkingModule,
    SubscriptionModule,
    TaxModule,
  ],
  controllers: [
    AppController,
    HealthController,
    FileUploadController,
    TransactionController,
    InvestmentController,
  ],
  providers: [
    FileUploadService,
    TransactionService,
    InvestmentService,
    AuditService,
  ],
})
export class AppModule {}