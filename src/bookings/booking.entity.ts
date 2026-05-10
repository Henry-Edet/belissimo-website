// src/bookings/booking.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Service } from '../services/service.entity';

export enum PaymentStatus {
  NONE         = 'none',
  DEPOSIT_PAID = 'deposit_paid',
  OWING        = 'owing',
  COMPLETED    = 'completed',
}

@Entity('booking')
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'serviceId' })
  serviceId!: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service!: Service;

  @Column({ name: 'clientName' })
  clientName!: string;

  @Column({ name: 'clientPhone' })
  clientPhone!: string;

  @Column({ name: 'userId', nullable: true })
  userId?: number;

  @Column({ name: 'startAt', type: 'timestamptz' })
  startAt!: Date;

  @Column({ name: 'endAt', type: 'timestamptz' })
  endAt!: Date;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ name: 'subServiceName', nullable: true })
  subServiceName?: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.NONE,
  })
  paymentStatus!: PaymentStatus;

  @Column({ name: 'balance_cents', default: 0 })
  balanceCents!: number;
}