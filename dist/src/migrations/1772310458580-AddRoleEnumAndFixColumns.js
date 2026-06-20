"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRoleEnumAndFixColumns1772310458580 = void 0;
class AddRoleEnumAndFixColumns1772310458580 {
    constructor() {
        this.name = 'AddRoleEnumAndFixColumns1772310458580';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."user_role_enum" AS ENUM ('admin', 'stylist', 'client');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        await queryRunner.query(`UPDATE "user" SET "role" = 'admin'   WHERE "role" = 'ADMIN'`);
        await queryRunner.query(`UPDATE "user" SET "role" = 'stylist' WHERE "role" = 'STAFF' OR "role" = 'STYLIST'`);
        await queryRunner.query(`UPDATE "user" SET "role" = 'client'  WHERE "role" = 'USER' OR "role" = 'CLIENT'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "role" TYPE "public"."user_role_enum"
      USING "role"::"public"."user_role_enum"
    `);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'client'`);
        await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user' AND column_name = 'passwordHash'
        ) THEN
          ALTER TABLE "user" RENAME COLUMN "passwordHash" TO "password_hash";
        END IF;
      END $$;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "role" TYPE varchar
      USING "role"::text
    `);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'admin'`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
        await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user' AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE "user" RENAME COLUMN "password_hash" TO "passwordHash";
        END IF;
      END $$;
    `);
    }
}
exports.AddRoleEnumAndFixColumns1772310458580 = AddRoleEnumAndFixColumns1772310458580;
//# sourceMappingURL=1772310458580-AddRoleEnumAndFixColumns.js.map