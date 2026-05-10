// src/migrations/1772310458701-UpdateGalleryFolders.ts
// Replaces old folder enum with the 4 branded sections

import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGalleryFolders1772310458701 implements MigrationInterface {
  name = 'UpdateGalleryFolders1772310458701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old enum and table, recreate cleanly with new enum values
    // Safe because no real data yet — gallery was just set up
    await queryRunner.query(`DROP TABLE IF EXISTS "gallery_item" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."gallery_item_folder_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."gallery_item_type_enum" CASCADE`);

    // Recreate with correct values
    await queryRunner.query(`
      CREATE TYPE "public"."gallery_item_type_enum" AS ENUM ('image', 'video')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."gallery_item_folder_enum"
        AS ENUM ('premium_quality', 'quick_service', 'expert_stylists', 'hygiene_first')
    `);
    await queryRunner.query(`
      CREATE TABLE "gallery_item" (
        "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
        "url"           TEXT NOT NULL,
        "s3_key"        TEXT NOT NULL,
        "thumbnail_url" TEXT,
        "type"          "public"."gallery_item_type_enum" NOT NULL DEFAULT 'image',
        "folder"        "public"."gallery_item_folder_enum" NOT NULL DEFAULT 'premium_quality',
        "original_name" TEXT NOT NULL,
        "mime_type"     VARCHAR(100) NOT NULL,
        "file_size"     INTEGER NOT NULL,
        "caption"       TEXT,
        "tags"          TEXT,
        "is_public"     BOOLEAN NOT NULL DEFAULT true,
        "uploaded_by"   INTEGER,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gallery_item" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_folder" ON "gallery_item" ("folder")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_created" ON "gallery_item" ("created_at" DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "gallery_item"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."gallery_item_folder_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."gallery_item_type_enum"`);
  }
}