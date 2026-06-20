import { MigrationInterface, QueryRunner } from "typeorm";
export declare class FixDuplicateTables1766609976644 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
