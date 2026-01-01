import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSubServiceNameToBookings1767294454250 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add subServiceName column
    await queryRunner.addColumn('bookings', new TableColumn({
      name: 'subServiceName',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }));

    // Add other optional columns if needed
    await queryRunner.addColumn('bookings', new TableColumn({
      name: 'durationMinutes',
      type: 'integer',
      isNullable: true,
    }));

    await queryRunner.addColumn('bookings', new TableColumn({
      name: 'priceCents',
      type: 'integer',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bookings', 'subServiceName');
    await queryRunner.dropColumn('bookings', 'durationMinutes');
    await queryRunner.dropColumn('bookings', 'priceCents');
  }
}