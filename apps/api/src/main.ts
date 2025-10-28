import 'dotenv/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  try {
    await app.listen(3000);
    console.log('Application is listening on port 3000');
  } catch (error) {
    console.error('Failed to start application:', error);
    throw error;
  }
}

void bootstrap();
