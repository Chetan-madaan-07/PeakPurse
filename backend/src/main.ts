import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Allow frontend to call the backend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Auto-validate & transform incoming request bodies/params
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip properties not in DTO
      transform: true,        // auto-cast types (e.g. string → number for @Query)
      forbidNonWhitelisted: false, // warn but don't throw on extra fields for now
    }),
  );

  // All routes prefixed with /api
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
  console.log(`PeakPurse Backend is running on http://localhost:${process.env.PORT || 3000}`);
}
bootstrap();