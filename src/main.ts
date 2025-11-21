import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  // ⛔ disable Nest’s JSON parser completely
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // ⛔ raw body ONLY for Stripe webhook
  app.use(
    '/payments/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );

  // ✔ normal JSON parser for all other routes
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf; // keep the raw body
      },
    }),
  );

  // ✔ global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
