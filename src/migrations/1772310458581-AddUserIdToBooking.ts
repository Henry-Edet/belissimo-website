// src/migrations/1772310458581-AddUserIdToBooking.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToBooking1772310458581 implements MigrationInterface {
  name = 'AddUserIdToBooking1772310458581';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking"
      ADD COLUMN IF NOT EXISTS "userId" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking"
      DROP COLUMN IF EXISTS "userId"
    `);
  }
}