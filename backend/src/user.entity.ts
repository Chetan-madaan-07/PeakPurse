import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Unified: supports both 'password' (auth module) and 'password_hash' (teammate naming)
  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: 'user' })
  role: string; // 'user' | 'ca' | 'admin'

  @Column({
    type: 'enum',
    enum: RiskProfile,
    default: RiskProfile.CONSERVATIVE,
  })
  risk_profile: RiskProfile;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
