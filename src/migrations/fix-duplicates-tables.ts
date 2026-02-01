// migrations/fix-duplicate-tables.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDuplicateTables1766609976644 implements MigrationInterface {
    name = 'FixDuplicateTables1766609976644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the duplicate 'service' table (singular)
        await queryRunner.query(`DROP TABLE "service"`);
        
        // Your 'services' table already exists with correct columns
        // No need to recreate it
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the dropped table if you need to rollback
        await queryRunner.query(`CREATE TABLE "service" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric NOT NULL, "duration" integer NOT NULL, CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id"))`);
    }
}