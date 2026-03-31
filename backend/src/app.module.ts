import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

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
import { AuditService } from './services/audit.service'; // NEW

// Entities
import { Transaction } from './transaction.entity';
import { User } from './user.entity';
import { Goal } from './goal.entity';
import { InvestmentPlan } from './investment-plan.entity';
import { AuditLog } from './audit-log.entity'; // NEW

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }), 
    
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        // Register AuditLog entity here
        entities: [Transaction, User, Goal, InvestmentPlan, AuditLog], 
        synchronize: true,
        logging: process.env.DB_LOGGING === 'true',
        ssl: {
          rejectUnauthorized: false,
        },
        connectTimeoutMS: 30000,
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),

    // Register AuditLog for injection into services
    TypeOrmModule.forFeature([Transaction, User, Goal, InvestmentPlan, AuditLog]),
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
    AuditService, // Added AuditService to providers
  ],
})
export class AppModule {}