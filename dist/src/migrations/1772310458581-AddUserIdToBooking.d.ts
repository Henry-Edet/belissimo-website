import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddUserIdToBooking1772310458581 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
