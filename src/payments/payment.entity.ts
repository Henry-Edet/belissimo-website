import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  // OneToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: string;

  // @OneToOne(() => Booking, (booking) => booking.payment, { eager: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column()
  bookingId: number;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ default: 'TRY' })
  currency: string;

  @Column({ default: 'stripe' })
  provider: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  providerId: string;

  @CreateDateColumn()
  createdAt: Date;
}
