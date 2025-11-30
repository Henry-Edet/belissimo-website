import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBookingTable1700000000000 implements MigrationInterface {
    name = 'UpdateBookingTable1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the new timestamp columns
        await queryRunner.query(`
            ALTER TABLE booking
            ADD COLUMN "startAt" TIMESTAMPTZ,
            ADD COLUMN "endAt" TIMESTAMPTZ
        `);

        // Optional but recommended:
        // convert any existing date/time strings into timestamps
        await queryRunner.query(`
            UPDATE booking
            SET "startAt" = (date || ' ' || time)::timestamptz,
                "endAt" = ((date || ' ' || time)::timestamptz + INTERVAL '1 hour')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE booking
            DROP COLUMN "startAt",
            DROP COLUMN "endAt"
        `);
    }
}
