// src/migrations/YYYYMMDDHHMMSS-CreateGalleryTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGalleryTable1767294454251 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'galleries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 's3Key',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '1000',
          },
          {
            name: 'originalName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'fileSize',
            type: 'int',
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'folder',
            type: 'varchar',
            length: '50',
            default: "'general'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: true,
          },
          {
            name: 'uploadedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes using TableIndex
    await queryRunner.createIndex(
      'galleries',
      new TableIndex({
        name: 'IDX_GALLERY_FOLDER',
        columnNames: ['folder'],
      }),
    );

    await queryRunner.createIndex(
      'galleries',
      new TableIndex({
        name: 'IDX_GALLERY_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('galleries', 'IDX_GALLERY_FOLDER');
    await queryRunner.dropIndex('galleries', 'IDX_GALLERY_CREATED_AT');
    await queryRunner.dropTable('galleries');
  }
}