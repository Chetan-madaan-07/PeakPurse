import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { Transaction } from './transaction.entity';

@Module({
  imports: [
    // Loads your .env file
    ConfigModule.forRoot(), 
    
    // Connects to Render PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Auto-creates tables
      ssl: {
        rejectUnauthorized: false, 
      }
    }),

    // Registers the Transaction schema
    TypeOrmModule.forFeature([Transaction]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}