import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tax_profiles')
export class TaxProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column({ default: () => "to_char(CURRENT_DATE, 'YYYY')" })
  financial_year: string; // e.g. "2025-26"

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  gross_income: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  deduction_80c: number; // max 150000

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  deduction_80d: number; // health insurance, max 25000

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  deduction_80ccd: number; // NPS, max 50000

  @Column('decimal', { precision: 15, scale: 2, default: 50000 })
  standard_deduction: number; // flat 50000 for salaried

  @Column({ default: 'new' }) // 'old' | 'new'
  regime: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  tax_old_regime: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  tax_new_regime: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  recommended_savings: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
