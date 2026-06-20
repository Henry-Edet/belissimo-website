"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTagToServices1748095000000 = void 0;
class AddTagToServices1748095000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS tag VARCHAR NULL`);
        await queryRunner.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE services DROP COLUMN IF EXISTS tag`);
        await queryRunner.query(`ALTER TABLE services DROP COLUMN IF EXISTS image_url`);
    }
}
exports.AddTagToServices1748095000000 = AddTagToServices1748095000000;
//# sourceMappingURL=1748095000000-AddTagToServices.js.map