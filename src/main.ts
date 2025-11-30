import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express = require('express');
import * as bodyParser from 'body-parser';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  // 🚧 Create a standalone Express instance
  const expressApp = express();

  // 🚨 MOUNT THE RAW WEBHOOK BODY **BEFORE** Nest
  expressApp.post(
    '/payments/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );

  // 🚀 Create Nest app ON TOP OF the Express instance
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bodyParser: false }, // ❗ disable Nest's built-in body parsing
  );

  // ✔ Normal JSON parsing for all OTHER routes
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf; // preserve full original body
      },
    }),
  );

  // ✔ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  expressApp.listen(3000, () =>
    console.log('🚀 Server running on http://localhost:3000'),
  );
}

bootstrap();
