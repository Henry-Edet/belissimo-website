import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddPaymentNotification1772310458600 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
