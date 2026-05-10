// src/payments/payment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';

export enum PaymentStatus {
  PENDING  = 'PENDING',
  PAID     = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number; // Fixed: was string, should be number

  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  // Explicit name prevents SnakeNamingStrategy converting to booking_id
  @Column({ name: 'bookingId' })
  bookingId!: number;

  @Column({ type: 'int', name: 'amountCents' })
  amountCents!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @Column({ default: 'stripe' })
  provider!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ nullable: true, name: 'providerId' })
  providerId!: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}