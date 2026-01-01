// src/services/service.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Booking } from '../bookings/booking.entity';

@Entity('services')
export class Service {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  durationMinutes: number;

  @Column({ type: 'integer' })
  priceCents: number;

  @Column({ type: 'integer' })
  depositPercentage: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Add this relationship
  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];
}