import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDuplicateTables1766609976644 implements MigrationInterface {
    name = 'FixDuplicateTables1766609976644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ✅ Safe drop — won't crash if table doesn't exist
        await queryRunner.query(`DROP TABLE IF EXISTS "service"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "service" (
            "id" SERIAL NOT NULL, 
            "name" character varying NOT NULL, 
            "price" numeric NOT NULL, 
            "duration" integer NOT NULL, 
            CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id")
        )`);
    }
}