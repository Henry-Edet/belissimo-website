"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSubServiceNameToBookings1767294454250 = void 0;
class AddSubServiceNameToBookings1767294454250 {
    constructor() {
        this.name = 'AddSubServiceNameToBookings1767294454250';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN IF NOT EXISTS "subServiceName" varchar DEFAULT ''
    `);
        await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN IF NOT EXISTS "durationMinutes" integer
    `);
        await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN IF NOT EXISTS "priceCents" integer
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "subServiceName"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "durationMinutes"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "priceCents"`);
    }
}
exports.AddSubServiceNameToBookings1767294454250 = AddSubServiceNameToBookings1767294454250;
//# sourceMappingURL=1767294454250-AddSubServiceNameToBookings.js.map