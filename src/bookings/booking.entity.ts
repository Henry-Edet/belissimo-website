import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  serviceId: string;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column()
  date: string; // YYYY-MM-DD

  @Column()
  time: string; // HH:mm

  @Column({ default: 'pending' }) 
  status: 'pending' | 'confirmed' | 'cancelled';
}
