import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  merchant_name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  start_date: string; // when the subscription started

  @Column({ type: 'date', nullable: true })
  end_date: string | null; // optional — null means ongoing

  @Column({ default: 'monthly' })
  billing_cycle: string; // 'weekly' | 'monthly' | 'quarterly' | 'yearly'

  @Column({ type: 'date' })
  next_renewal: string; // auto-computed from start_date + billing_cycle

  @CreateDateColumn()
  created_at: Date;
}
