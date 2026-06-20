"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGalleryItem1772310458700 = void 0;
class AddGalleryItem1772310458700 {
    constructor() {
        this.name = 'AddGalleryItem1772310458700';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."gallery_item_type_enum" AS ENUM ('image', 'video');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."gallery_item_folder_enum"
          AS ENUM ('gallery', 'portfolio', 'before_after', 'team');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gallery_item" (
        "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
        "url"           TEXT NOT NULL,
        "s3_key"        TEXT NOT NULL,
        "thumbnail_url" TEXT,
        "type"          "public"."gallery_item_type_enum" NOT NULL DEFAULT 'image',
        "folder"        "public"."gallery_item_folder_enum" NOT NULL DEFAULT 'gallery',
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gallery_folder" ON "gallery_item" ("folder")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gallery_created" ON "gallery_item" ("created_at" DESC)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "gallery_item"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."gallery_item_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."gallery_item_folder_enum"`);
    }
}
exports.AddGalleryItem1772310458700 = AddGalleryItem1772310458700;
//# sourceMappingURL=1772310458700-AddGalleryItem.js.map