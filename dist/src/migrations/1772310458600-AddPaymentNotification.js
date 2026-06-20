"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPaymentNotification1772310458600 = void 0;
class AddPaymentNotification1772310458600 {
    constructor() {
        this.name = 'AddPaymentNotification1772310458600';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."payment_notification_status_enum"
          AS ENUM ('pending', 'confirmed', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_notification" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "client_name" varchar NOT NULL,
        "client_phone" varchar,
        "amount_cents" integer NOT NULL,
        "payment_method" varchar NOT NULL,
        "reference" varchar,
        "status" "public"."payment_notification_status_enum" NOT NULL DEFAULT 'pending',
        "admin_note" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "confirmed_at" TIMESTAMP,
        CONSTRAINT "PK_payment_notification" PRIMARY KEY ("id")
      )
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_notification"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."payment_notification_status_enum"`);
    }
}
exports.AddPaymentNotification1772310458600 = AddPaymentNotification1772310458600;
//# sourceMappingURL=1772310458600-AddPaymentNotification.js.map