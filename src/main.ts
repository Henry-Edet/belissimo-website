import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express = require('express');
import * as bodyParser from 'body-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  app.enableCors({
    origin: "*", // or restrict later
  });

  // ✔ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ============================================
  // 🎯 SWAGGER API DOCUMENTATION SETUP
  // ============================================
  const config = new DocumentBuilder()
    .setTitle('Bellissimo Hair Studio API')
    .setDescription('Complete API documentation for Bellissimo Hair Studio booking system')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('services', 'Hair services management')
    .addTag('bookings', 'Booking and appointment management')
    .addTag('payments', 'Payment processing')
    .addTag('users', 'User management')
    .addTag('gallery', 'Image gallery and uploads') // Add this for the new gallery module
    .addTag('ai', 'AI chatbot assistant')
    .addTag('chat', 'Chat functionality')
    .addTag('notifications', 'Notification system')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token', // This name here is important for matching up with @ApiBearerAuth('access-token')
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter refresh token',
        in: 'header',
      },
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

  // ============================================
  // 🚀 START THE SERVER
  // ============================================
  await app.listen(3000, '0.0.0.0');
  console.log('============================================');
  console.log('🚀 Backend running on http://0.0.0.0:3000');
  console.log('📚 API Documentation: http://0.0.0.0:3000/api');
  console.log('============================================');
}

bootstrap();