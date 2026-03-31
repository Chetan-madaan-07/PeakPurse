import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
