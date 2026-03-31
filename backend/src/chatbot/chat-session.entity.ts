import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nullable until auth module is built
  @Column({ nullable: true })
  user_id: string;

  @Column('jsonb', { default: [] })
  turns: ChatTurn[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
