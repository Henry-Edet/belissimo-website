import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class UpdateGalleryFolders1772310458701 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
