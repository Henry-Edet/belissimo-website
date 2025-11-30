import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  serviceId: string;

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
}
