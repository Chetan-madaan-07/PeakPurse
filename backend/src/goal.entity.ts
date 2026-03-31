import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum GoalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum GoalFeasibility {
  ACHIEVABLE = 'achievable',
  STRETCHED = 'stretched',
  UNREALISTIC = 'unrealistic',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // In a real app this would be a @ManyToOne relation, 
  // but for a hackathon keeping it as a simple column prevents TypeORM circular dependency headaches
  @Column({ type: 'uuid', nullable: true }) 
  user_id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 15, scale: 2 })
  target_amount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  current_amount: number;

  @Column({ type: 'date' })
  target_date: string;

  @Column({
    type: 'enum',
    enum: GoalPriority,
    default: GoalPriority.MEDIUM,
  })
  priority: GoalPriority;

  @Column({
    type: 'enum',
    enum: GoalFeasibility,
    nullable: true,
  })
  feasibility: GoalFeasibility;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}