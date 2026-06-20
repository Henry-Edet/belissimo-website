"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixDuplicateTables1766609976644 = void 0;
class FixDuplicateTables1766609976644 {
    constructor() {
        this.name = 'FixDuplicateTables1766609976644';
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "service"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`CREATE TABLE "service" (
            "id" SERIAL NOT NULL, 
            "name" character varying NOT NULL, 
            "price" numeric NOT NULL, 
            "duration" integer NOT NULL, 
            CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id")
        )`);
    }
}
exports.FixDuplicateTables1766609976644 = FixDuplicateTables1766609976644;
//# sourceMappingURL=fix-duplicates-tables.js.map