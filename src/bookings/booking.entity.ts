// src/bookings/booking.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Service } from '../services/service.entity';

@Entity('booking')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  // Match EXACT column name from your database (camelCase with quotes)
  @Column({ name: 'serviceId' })
  serviceId: string;

  // Map to the Service entity
  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ name: 'clientName' })
  clientName: string;

  @Column({ name: 'clientPhone' })
  clientPhone: string;

  @Column({ name: 'startAt', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'endAt', type: 'timestamptz' })
  endAt: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'subServiceName', nullable: true })
  subServiceName?: string;
}