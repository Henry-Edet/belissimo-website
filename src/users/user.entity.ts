// src/users/user.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
} from 'typeorm';

// ─── Role Enum ────────────────────────────────────────────────────────────────
// Single source of truth for roles — used in entity, auth service, guards, decorators
// ✅ Matches auth.service.ts roles exactly

export enum Role {
  ADMIN   = 'admin',
  STYLIST = 'stylist',
  CLIENT  = 'client',   // ← was 'USER', now 'client' to match auth service
}

// ─── Entity ───────────────────────────────────────────────────────────────────

@Entity('user')
export class User {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  // ✅ Enum constraint — only 'admin' | 'stylist' | 'client' allowed in DB
  // ✅ Default is 'client' — safe for public registration
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CLIENT,
  })
  role!: Role;

  // ── Profile ────────────────────────────────────────────────────────────────

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  phone?: string;

  // ── Verification ───────────────────────────────────────────────────────────

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  // ── Password Reset ─────────────────────────────────────────────────────────

  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', nullable: true, type: 'timestamp' })
  passwordResetExpires?: Date;

  // ── Auth Tokens ────────────────────────────────────────────────────────────

  // ✅ Matches migration column name 'refresh_token_hash' exactly
  @Column({ name: 'refresh_token_hash', nullable: true })
  refreshTokenHash?: string;

  // ── Activity ───────────────────────────────────────────────────────────────

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt?: Date;

  // ✅ CreateDateColumn auto-sets on INSERT, never changes after
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // ✅ UpdateDateColumn auto-updates on every SAVE — no manual handling needed
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}