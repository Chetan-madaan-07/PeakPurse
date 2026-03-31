import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RiskProfile } from './user.entity';

@Entity('investment_plans')
export class InvestmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'uuid' })
  goal_id: string;

  @Column({
    type: 'enum',
    enum: RiskProfile,
  })
  risk_profile: RiskProfile;

  // Stores JSON like: { "equity": 0.8, "debt": 0.2 }
  @Column({ type: 'jsonb' })
  asset_mix: Record<string, number>;

  // Stores JSON like: { "conservative": 500000, "base": 600000, "optimistic": 750000 }
  @Column({ type: 'jsonb', nullable: true })
  return_scenarios: Record<string, number>;

  @Column('decimal', { precision: 15, scale: 2 })
  monthly_sip: number;

  @Column({ default: false })
  budget_conflict: boolean;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  tax_benefit_80c: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}