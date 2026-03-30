import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('transactions')
@Index(['hash', 'date']) // Composite index for common queries
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  hash: string;

  @Column({ type: 'date' })
  date: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  merchant_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 'ml', nullable: true }) // 'rule', 'ml', or 'user_override'
  category_source: string;

  @Column({ default: false })
  is_recurring: boolean;

  @Column({ default: false })
  tax_relevant: boolean;

  @Column('decimal', { precision: 3, scale: 2, default: 0.0 })
  confidence: number;

  @Column({ default: 1 })
  page_number: number;

  @Column({ default: 0 })
  transaction_index: number;

  @Column('jsonb', { nullable: true }) // Store raw ML tokens as JSON
  raw_tokens: Record<string, any>[];

  @Column({ nullable: true })
  processed_at: string;

  @Column({ default: '1.0.0' })
  processor_version: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

}
