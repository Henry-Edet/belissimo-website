// 1772310458579-CreateGalleryTable.ts — KEEP THIS ONE, with fixes
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGalleryTable1772310458579 implements MigrationInterface {
    name = 'CreateGalleryTable1772310458579'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ✅ Safe constraint drops
        await queryRunner.query(`
            ALTER TABLE "booking" 
            DROP CONSTRAINT IF EXISTS "fk_booking_service"
        `);
        await queryRunner.query(`
            ALTER TABLE "booking" 
            DROP CONSTRAINT IF EXISTS "booking_no_overlap"
        `);

        // ✅ Safe table creation
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "galleries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "s3Key" character varying NOT NULL, 
                "url" character varying NOT NULL, 
                "originalName" character varying NOT NULL, 
                "fileSize" integer NOT NULL, 
                "mimeType" character varying NOT NULL, 
                "folder" character varying NOT NULL DEFAULT 'general', 
                "description" character varying, 
                "tags" text, 
                "width" integer, 
                "height" integer, 
                "isPublic" boolean NOT NULL DEFAULT true, 
                "uploadedBy" character varying, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_86b77299615c92db3d68c9c7919" PRIMARY KEY ("id")
            )
        `);

        // ✅ Safe column changes
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "refreshTokenHash"`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "refresh_token_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "is_verified" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" SET NOT NULL`);

        await queryRunner.query(`
            ALTER TABLE "booking" 
            ADD CONSTRAINT "FK_e812cafb996fae4e9636ffe294f" 
            FOREIGN KEY ("serviceId") REFERENCES "services"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "FK_e812cafb996fae4e9636ffe294f"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "is_verified" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "refresh_token_hash"`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "refreshTokenHash" text`);
        await queryRunner.query(`DROP TABLE IF EXISTS "galleries"`);
        await queryRunner.query(`
            ALTER TABLE "booking" ADD CONSTRAINT "booking_no_overlap" 
            EXCLUDE USING gist (
                "serviceId" WITH =, 
                tstzrange("startAt", "endAt", '[)'::text) WITH &&
            ) WHERE (((status)::text <> 'cancelled'::text))
        `);
        await queryRunner.query(`
            ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_service" 
            FOREIGN KEY ("serviceId") REFERENCES "services"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}