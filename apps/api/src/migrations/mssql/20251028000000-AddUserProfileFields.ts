import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields20251028000000 implements MigrationInterface {
  name = 'AddUserProfileFields20251028000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'email'
      )
      BEGIN
        ALTER TABLE [dbo].[users]
        ADD [email] nvarchar(255) NULL;
      END
    `);

    // Add phone column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'phone'
      )
      BEGIN
        ALTER TABLE [dbo].[users]
        ADD [phone] nvarchar(50) NULL;
      END
    `);

    // Add bio column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'bio'
      )
      BEGIN
        ALTER TABLE [dbo].[users]
        ADD [bio] nvarchar(max) NULL;
      END
    `);

    // Add dateOfBirth column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'date_of_birth'
      )
      BEGIN
        ALTER TABLE [dbo].[users]
        ADD [date_of_birth] date NULL;
      END
    `);

    // Add index on email for performance
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_users_email'
        AND object_id = OBJECT_ID('[dbo].[users]')
      )
      BEGIN
        CREATE INDEX [IDX_users_email]
        ON [dbo].[users] ([email]);
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_users_email'
        AND object_id = OBJECT_ID('[dbo].[users]')
      )
      DROP INDEX [IDX_users_email] ON [dbo].[users];
    `);

    // Drop columns
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'date_of_birth'
      )
      BEGIN
        ALTER TABLE [dbo].[users] DROP COLUMN [dateOfBirth];
      END
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'bio'
      )
      BEGIN
        ALTER TABLE [dbo].[users] DROP COLUMN [bio];
      END
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'phone'
      )
      BEGIN
        ALTER TABLE [dbo].[users] DROP COLUMN [phone];
      END
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[users]')
        AND name = 'email'
      )
      BEGIN
        ALTER TABLE [dbo].[users] DROP COLUMN [email];
      END
    `);
  }
}