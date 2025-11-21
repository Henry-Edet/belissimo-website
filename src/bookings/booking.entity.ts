import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  // OneToOne,
} from 'typeorm';
import { Payment } from '../payments/payment.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string | null;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  // @OneToOne(() => Payment, (payment) => payment.booking, { nullable: true })
  // payment?: Payment;
}
