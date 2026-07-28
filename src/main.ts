import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express = require('express');
import * as bodyParser from 'body-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const expressApp = express();

  expressApp.post(
    '/payments/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bodyParser: false },
  );

  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Bellissimo Hair Studio API')
    .setDescription('Complete API documentation for Bellissimo Hair Studio booking system')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('services', 'Hair services management')
    .addTag('bookings', 'Booking and appointment management')
    .addTag('payments', 'Payment processing')
    .addTag('users', 'User management')
    .addTag('gallery', 'Image gallery and uploads')
    .addTag('ai', 'AI chatbot assistant')
    .addTag('chat', 'Chat functionality')
    .addTag('notifications', 'Notification system')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', description: 'Enter JWT token', in: 'header' },
      'access-token',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', description: 'Enter refresh token', in: 'header' },
      'refresh-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Bellissimo API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
    },
  });

  // ── Read PORT from environment — Elastic Beanstalk uses 8080 ──
  // Keep-alive ping every 14 minutes to prevent Render free tier cold starts
  setInterval(async () => {
    try {
      await fetch(`https://bellissimo-backend.onrender.com/bookings/stats`);
    } catch {}
  }, 14 * 60 * 1000);

  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0');
  console.log('============================================');
  console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
  console.log(`📚 API Docs: http://0.0.0.0:${port}/api`);
  console.log('============================================');
}

bootstrap();