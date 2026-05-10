// src/chat/chat-message.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum MessageSender {
  USER = 'user',
  AI   = 'ai',
  ADMIN = 'admin', // when admin takes over
}

@Entity('chat_message')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  // Session ID — matches userId sent from frontend
  @Column({ name: 'session_id' })
  sessionId!: string;

  @Column({ name: 'client_name', nullable: true })
  clientName?: string;

  @Column({ type: 'enum', enum: MessageSender, default: MessageSender.USER })
  sender!: MessageSender;

  @Column({ type: 'text' })
  message!: string;

  // AI response linked to this message
  @Column({ type: 'text', nullable: true })
  reply?: string;

  // Admin flagged this conversation for takeover
  @Column({ name: 'flagged_for_takeover', default: false })
  flaggedForTakeover!: boolean;

  // Admin has taken over this session
  @Column({ name: 'admin_taken_over', default: false })
  adminTakenOver!: boolean;

  // Action triggered by AI
  @Column({ nullable: true })
  action?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}