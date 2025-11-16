import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // strips unknown fields
    forbidNonWhitelisted: true,  // blocks unknown fields
    transform: true,        // transforms payloads into DTO classes
  }));

  await app.listen(3000);
}
bootstrap();
