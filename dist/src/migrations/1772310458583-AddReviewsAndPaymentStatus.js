"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReviewsAndPaymentStatus1772310458583 = void 0;
class AddReviewsAndPaymentStatus1772310458583 {
    constructor() {
        this.name = 'AddReviewsAndPaymentStatus1772310458583';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "user_id" integer,
        "client_name" varchar NOT NULL,
        "rating" integer NOT NULL,
        "comment" text NOT NULL,
        "likes" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_booking" UNIQUE ("booking_id")
      )
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."booking_payment_status_enum"
          AS ENUM ('none', 'deposit_paid', 'owing', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        await queryRunner.query(`
      ALTER TABLE "booking"
      ADD COLUMN IF NOT EXISTS "payment_status"
        "public"."booking_payment_status_enum" NOT NULL DEFAULT 'none'
    `);
        await queryRunner.query(`
      ALTER TABLE "booking"
      ADD COLUMN IF NOT EXISTS "balance_cents" integer NOT NULL DEFAULT 0
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "balance_cents"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "payment_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."booking_payment_status_enum"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "review"`);
    }
}
exports.AddReviewsAndPaymentStatus1772310458583 = AddReviewsAndPaymentStatus1772310458583;
//# sourceMappingURL=1772310458583-AddReviewsAndPaymentStatus.js.map