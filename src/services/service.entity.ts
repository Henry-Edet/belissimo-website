// service.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Booking } from '../bookings/booking.entity'; // Make sure to import Booking

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ name: 'price_cents' })
  priceCents: number;

  @Column({ name: 'deposit_percentage', default: 30 })
  depositPercentage: number;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // ADD THIS RELATIONSHIP
  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];
}