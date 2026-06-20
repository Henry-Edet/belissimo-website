import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddReviewsAndPaymentStatus1772310458583 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
