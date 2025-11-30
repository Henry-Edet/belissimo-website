import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBookingTable1764182298430 implements MigrationInterface {
    name = 'UpdateBookingTable1764182298430';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "booking"
            ADD CONSTRAINT "UQ_booking_service_date_time"
            UNIQUE ("serviceId", "date", "time");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "booking"
            DROP CONSTRAINT "UQ_booking_service_date_time";
        `);
    }
}
