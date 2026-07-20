import { MigrationInterface, QueryRunner } from 'typeorm';

export class GalleryFolderVarchar1753000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change folder column from enum to varchar so new folders can be added without migrations
    await queryRunner.query(`
      ALTER TABLE gallery_item 
      ALTER COLUMN folder TYPE VARCHAR(50)
    `);
    // Update any old quick_service entries to before_after
    await queryRunner.query(`
      UPDATE gallery_item SET folder = 'before_after' WHERE folder = 'quick_service'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE gallery_item 
      ALTER COLUMN folder TYPE VARCHAR(50)
    `);
  }
}