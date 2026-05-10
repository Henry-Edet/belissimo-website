// src/reviews/review.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('review')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'booking_id' })
  bookingId!: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @Column({ name: 'client_name' })
  clientName!: string;

  @Column({ type: 'int' })
  rating!: number; // 1-5

  @Column({ type: 'text' })
  comment!: string;

  @Column({ default: 0 })
  likes!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}