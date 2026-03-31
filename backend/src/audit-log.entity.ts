import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  event_type: string; // e.g., 'RISK_PROFILE_UPDATED' or 'GOAL_FEASIBILITY_CHECK'

  @Column('jsonb', { nullable: true })
  metadata: any; // Stores the actual calculation results or quiz scores

  @CreateDateColumn()
  timestamp: Date;
}