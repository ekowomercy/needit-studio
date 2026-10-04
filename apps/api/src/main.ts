import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true });
  app.setGlobalPrefix('api/v1');
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`[needit-api] listening on :${port}`);
}

void bootstrap();