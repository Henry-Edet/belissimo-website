// src/migrations/1772310458582-CreateChatMessageTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatMessageTable1772310458582 implements MigrationInterface {
  name = 'CreateChatMessageTable1772310458582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_message" (
        "id" SERIAL NOT NULL,
        "session_id" varchar NOT NULL,
        "client_name" varchar,
        "sender" varchar NOT NULL DEFAULT 'user',
        "message" text NOT NULL,
        "reply" text,
        "flagged_for_takeover" boolean NOT NULL DEFAULT false,
        "admin_taken_over" boolean NOT NULL DEFAULT false,
        "action" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_message" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_message_session"
      ON "chat_message" ("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_message"`);
  }
}