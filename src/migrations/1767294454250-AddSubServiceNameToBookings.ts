import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubServiceNameToBookings1767294454250 implements MigrationInterface {
  name = 'AddSubServiceNameToBookings1767294454250'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ✅ Raw SQL gives us IF NOT EXISTS — addColumn() doesn't support this
    await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN IF NOT EXISTS "subServiceName" varchar DEFAULT ''
    `);

    await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN IF NOT EXISTS "durationMinutes" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN IF NOT EXISTS "priceCents" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "subServiceName"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "durationMinutes"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "priceCents"`);
  }
}