import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Transaction } from './transaction.entity';
import { ChatSession } from './chatbot/chat-session.entity';
import { User } from './auth/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'peakpurse_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'peakpurse_dev',
  entities: [Transaction, ChatSession, User],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
