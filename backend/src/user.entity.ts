import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  // SECURE VERSION: Reverting to NOT NULL now that the database column exists.
  @Column() 
  password_hash: string;

  @Column({
    type: 'enum',
    enum: RiskProfile,
    default: RiskProfile.CONSERVATIVE,
  })
  risk_profile: RiskProfile;
}