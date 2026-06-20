"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserIdToBooking1772310458581 = void 0;
class AddUserIdToBooking1772310458581 {
    constructor() {
        this.name = 'AddUserIdToBooking1772310458581';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "booking"
      ADD COLUMN IF NOT EXISTS "userId" integer
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "booking"
      DROP COLUMN IF EXISTS "userId"
    `);
    }
}
exports.AddUserIdToBooking1772310458581 = AddUserIdToBooking1772310458581;
//# sourceMappingURL=1772310458581-AddUserIdToBooking.js.map