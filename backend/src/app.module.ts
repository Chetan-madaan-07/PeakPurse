import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { Transaction } from './transaction.entity';
import { FileUploadService } from './services/file-upload.service';
import { TransactionService } from './services/transaction.service';
import { HealthController } from './controllers/health.controller';
import { FileUploadController } from './controllers/file-upload.controller';
import { TransactionController } from './controllers/transaction.controller';

@Module({
  imports: [
    // Loads your .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }), 
    
    // Connects to PostgreSQL with proper configuration
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'peakpurse_user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'peakpurse_dev',
        entities: [Transaction],
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
        logging: process.env.DB_LOGGING === 'true',
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: false,
        } : false,
        connectTimeoutMS: 30000,   // 30s timeout for remote DBs (Render, etc.)
        retryAttempts: 5,          // stop after 5 attempts instead of looping forever
        retryDelay: 3000,          // 3s between retries
      }),
    }),


    // Registers the Transaction schema
    TypeOrmModule.forFeature([Transaction]),
  ],
  controllers: [
    AppController,
    HealthController,
    FileUploadController,
    TransactionController,
  ],
  providers: [
    FileUploadService,
    TransactionService,
  ],
})
export class AppModule {}