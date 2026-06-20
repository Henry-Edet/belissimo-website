import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateGalleryTable1772310458579 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
