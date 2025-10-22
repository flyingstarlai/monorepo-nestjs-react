import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeDatabaseMSSQL20251022000000 implements MigrationInterface {
  name = 'InitializeDatabaseMSSQL20251022000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Roles table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[roles] (
          [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
          [name] nvarchar(255) NOT NULL,
          [description] nvarchar(255) NULL,
          [createdAt] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          [updatedAt] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          CONSTRAINT [PK_roles_id] PRIMARY KEY ([id]),
          CONSTRAINT [UQ_roles_name] UNIQUE ([name])
        )
      END
    `);

    // Users table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[users] (
          [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
          [username] nvarchar(255) NOT NULL,
          [name] nvarchar(255) NOT NULL,
          [password] nvarchar(255) NOT NULL,
          [roleId] uniqueidentifier NULL,
          [avatar] nvarchar(max) NULL,
          [isActive] bit NOT NULL DEFAULT 1,
          [createdAt] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          [updatedAt] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          CONSTRAINT [PK_users_id] PRIMARY KEY ([id]),
          CONSTRAINT [UQ_users_username] UNIQUE ([username])
        )
      END
    `);

    // Activities table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activities]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[activities] (
          [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
          [owner_id] uniqueidentifier NOT NULL,
          [type] nvarchar(255) NOT NULL,
          [message] nvarchar(255) NOT NULL,
          [metadata] nvarchar(max) NULL,
          [createdAt] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          CONSTRAINT [PK_activities_id] PRIMARY KEY ([id])
        )
      END
    `);

    // Foreign key: users.roleId -> roles.id
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_users_role'
      )
      BEGIN
        ALTER TABLE [dbo].[users]
        ADD CONSTRAINT [FK_users_role]
        FOREIGN KEY ([roleId]) REFERENCES [dbo].[roles]([id])
        ON DELETE SET NULL ON UPDATE NO ACTION;
      END
    `);

    // Foreign key: activities.owner_id -> users.id
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_activities_owner'
      )
      BEGIN
        ALTER TABLE [dbo].[activities]
        ADD CONSTRAINT [FK_activities_owner]
        FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id])
        ON DELETE CASCADE ON UPDATE NO ACTION;
      END
    `);

    // Index on activities (owner_id, createdAt)
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_activities_owner_created' AND object_id = OBJECT_ID('[dbo].[activities]')
      )
      BEGIN
        CREATE INDEX [IDX_activities_owner_created]
        ON [dbo].[activities] ([owner_id], [createdAt]);
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_activities_owner_created' AND object_id = OBJECT_ID('[dbo].[activities]')
      )
      DROP INDEX [IDX_activities_owner_created] ON [dbo].[activities];
    `);

    // Drop foreign keys
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_activities_owner')
      ALTER TABLE [dbo].[activities] DROP CONSTRAINT [FK_activities_owner];
    `);

    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_users_role')
      ALTER TABLE [dbo].[users] DROP CONSTRAINT [FK_users_role];
    `);

    // Drop tables
    await queryRunner.query(`IF OBJECT_ID('[dbo].[activities]', 'U') IS NOT NULL DROP TABLE [dbo].[activities];`);
    await queryRunner.query(`IF OBJECT_ID('[dbo].[users]', 'U') IS NOT NULL DROP TABLE [dbo].[users];`);
    await queryRunner.query(`IF OBJECT_ID('[dbo].[roles]', 'U') IS NOT NULL DROP TABLE [dbo].[roles];`);
  }
}
