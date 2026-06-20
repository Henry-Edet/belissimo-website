"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateGalleryTable1772310458579 = void 0;
class CreateGalleryTable1772310458579 {
    constructor() {
        this.name = 'CreateGalleryTable1772310458579';
    }
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "booking" 
            DROP CONSTRAINT IF EXISTS "fk_booking_service"
        `);
        await queryRunner.query(`
            ALTER TABLE "booking" 
            DROP CONSTRAINT IF EXISTS "booking_no_overlap"
        `);
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
    async down(queryRunner) {
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
exports.CreateGalleryTable1772310458579 = CreateGalleryTable1772310458579;
//# sourceMappingURL=1772310458579-CreateGalleryTable.js.map