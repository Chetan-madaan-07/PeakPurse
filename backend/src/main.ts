import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // This ensures all our routes automatically start with /api
  app.setGlobalPrefix('api'); 
  await app.listen(3000);
  console.log('PeakPurse Backend is running on http://localhost:3000');
}
bootstrap();