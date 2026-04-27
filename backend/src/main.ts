import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';

const uploadsPath = existsSync(join(process.cwd(), 'uploads'))
  ? join(process.cwd(), 'uploads')
  : join(process.cwd(), 'backend', 'uploads');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3001}`);
}
void bootstrap();
