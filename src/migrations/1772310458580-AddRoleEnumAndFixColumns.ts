import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleEnumAndFixColumns1772310458580 implements MigrationInterface {
  name = 'AddRoleEnumAndFixColumns1772310458580';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the enum type safely
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."user_role_enum" AS ENUM ('admin', 'stylist', 'client');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Normalize stale values only if column is still varchar (skip on fresh DB)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user' AND column_name = 'role' AND data_type = 'character varying'
        ) THEN
          UPDATE "user" SET "role" = 'admin'   WHERE "role" = 'ADMIN';
          UPDATE "user" SET "role" = 'stylist' WHERE "role" IN ('STAFF', 'STYLIST');
          UPDATE "user" SET "role" = 'client'  WHERE "role" IN ('USER', 'CLIENT');
        END IF;
      END $$;
    `);

    // 3. Drop default before type change
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);

    // 4. Change column type to enum
    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "role" TYPE "public"."user_role_enum"
      USING "role"::"public"."user_role_enum"
    `);

    // 5. Set new default after type change
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'client'`);

    // 6. Rename passwordHash → password_hash if old column still exists
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

  public async down(queryRunner: QueryRunner): Promise<void> {
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