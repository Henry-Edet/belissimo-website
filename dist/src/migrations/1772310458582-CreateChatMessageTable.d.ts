import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateChatMessageTable1772310458582 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
