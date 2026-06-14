import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagToServices1748095000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS tag VARCHAR NULL`);
    await queryRunner.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE services DROP COLUMN IF EXISTS tag`);
    await queryRunner.query(`ALTER TABLE services DROP COLUMN IF EXISTS image_url`);
  }
}