// src/payments/payment-notification.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationStatus {
  PENDING   = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED  = 'rejected',
}

@Entity('payment_notification')
export class PaymentNotification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'booking_id' })
  bookingId!: number;

  @Column({ name: 'client_name' })
  clientName!: string;

  @Column({ name: 'client_phone', nullable: true })
  clientPhone?: string;

  @Column({ name: 'amount_cents' })
  amountCents!: number;

  // 'bank_transfer' | 'crypto'
  @Column({ name: 'payment_method' })
  paymentMethod!: string;

  // Client pastes bank ref, transaction hash, etc.
  @Column({ name: 'reference', nullable: true })
  reference?: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ name: 'admin_note', nullable: true })
  adminNote?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'confirmed_at', nullable: true })
  confirmedAt?: Date;
}