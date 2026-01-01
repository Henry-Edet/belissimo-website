// src/bookings/booking.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, ManyToOne } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { Service } from '../services/service.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  serviceId: string;

  @Column()
  subServiceName: string;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Column({ type: 'integer', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'integer', nullable: true })
  priceCents?: number;

  @Column({ type: 'integer', nullable: true })
  depositAmount?: number;

  @Column({ type: 'integer', nullable: true })
  totalAmount?: number;

  @Column({ nullable: true })
  paymentStatus?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToOne(() => Payment, (payment) => payment.booking, { nullable: true })
  payment?: Payment;

  @ManyToOne(() => Service, (service) => service.bookings, { nullable: true })
  service?: Service;
}