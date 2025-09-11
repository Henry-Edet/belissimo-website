import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Service } from './service.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Service, { eager: true })
  service: Service;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ default: 'pending' })
  status: string;
}
