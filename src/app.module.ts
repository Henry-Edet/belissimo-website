// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/booking.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AwsModule } from './aws/aws.module';
import { GalleryModule } from './gallery/gallery.module';
import { NotificationModule } from './notifications/notification.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      namingStrategy: new SnakeNamingStrategy(),
      autoLoadEntities: true,
      synchronize: true, // ← creates tables on first run, we disable after
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }),
    ServicesModule,
    BookingsModule,
    PaymentsModule,
    AuthModule,
    AiModule,
    AwsModule,
    GalleryModule,
    NotificationModule,
    UsersModule,
    AdminModule,
    ReviewsModule,
  ],
})
export class AppModule {}