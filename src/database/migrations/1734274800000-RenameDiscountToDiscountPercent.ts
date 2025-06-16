import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDiscountToDiscountPercent1734274800000
  implements MigrationInterface
{
  name = 'RenameDiscountToDiscountPercent1734274800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the discount column to discountPercent and adjust the data type
    await queryRunner.query(`
      ALTER TABLE products 
      CHANGE COLUMN discount discountPercent DECIMAL(5,2) NULL
    `);

    // Convert existing data from decimal (0.2) to percentage (20)
    await queryRunner.query(`
      UPDATE products 
      SET discountPercent = discountPercent * 100 
      WHERE discountPercent IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert data back from percentage (20) to decimal (0.2)
    await queryRunner.query(`
      UPDATE products 
      SET discountPercent = discountPercent / 100 
      WHERE discountPercent IS NOT NULL
    `);

    // Rename back to discount column
    await queryRunner.query(`
      ALTER TABLE products 
      CHANGE COLUMN discountPercent discount DECIMAL(5,4) NULL
    `);
  }
}
