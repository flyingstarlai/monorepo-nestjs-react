import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspacesMSSQL20251027000000 implements MigrationInterface {
  name = 'AddWorkspacesMSSQL20251027000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Workspaces table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[workspaces]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[workspaces] (
          [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
          [name] nvarchar(255) NOT NULL,
          [slug] nvarchar(255) NOT NULL,
          [is_active] bit NOT NULL DEFAULT 1,
          [created_at] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          [updated_at] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          CONSTRAINT [PK_workspaces_id] PRIMARY KEY ([id]),
          CONSTRAINT [UQ_workspaces_slug] UNIQUE ([slug])
        )
      END
    `);

    // Workspace members table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[workspace_members]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[workspace_members] (
          [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
          [workspace_id] uniqueidentifier NOT NULL,
          [user_id] uniqueidentifier NOT NULL,
          [role] nvarchar(50) NOT NULL CHECK ([role] IN ('Owner','Admin','Author','Member')),
          [is_active] bit NOT NULL DEFAULT 1,
          [joined_at] datetime2 NOT NULL DEFAULT SYSDATETIME(),
          CONSTRAINT [PK_workspace_members_id] PRIMARY KEY ([id]),
          CONSTRAINT [UQ_workspace_members_workspace_user] UNIQUE ([workspace_id], [user_id])
        )
      END
    `);

    // Foreign keys for workspace_members
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_workspace_members_workspace'
      )
      BEGIN
        ALTER TABLE [dbo].[workspace_members]
        ADD CONSTRAINT [FK_workspace_members_workspace]
        FOREIGN KEY ([workspace_id]) REFERENCES [dbo].[workspaces]([id])
        ON DELETE CASCADE ON UPDATE NO ACTION;
      END
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_workspace_members_user'
      )
      BEGIN
        ALTER TABLE [dbo].[workspace_members]
        ADD CONSTRAINT [FK_workspace_members_user]
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id])
        ON DELETE CASCADE ON UPDATE NO ACTION;
      END
    `);

    // Add workspaceId to activities table
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[activities]')
        AND name = 'workspace_id'
      )
      BEGIN
        ALTER TABLE [dbo].[activities]
        ADD [workspace_id] uniqueidentifier NULL;
      END
    `);

    // Foreign key: activities.workspaceId -> workspaces.id
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_activities_workspace'
      )
      BEGIN
        ALTER TABLE [dbo].[activities]
        ADD CONSTRAINT [FK_activities_workspace]
        FOREIGN KEY ([workspace_id]) REFERENCES [dbo].[workspaces]([id])
        ON DELETE SET NULL ON UPDATE NO ACTION;
      END
    `);

    // Index on workspace_members (workspaceId, role)
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_workspace_members_workspace_role'
        AND object_id = OBJECT_ID('[dbo].[workspace_members]')
      )
      BEGIN
        CREATE INDEX [IDX_workspace_members_workspace_role]
        ON [dbo].[workspace_members] ([workspace_id], [role]);
      END
    `);

    // Index on workspace_members (userId)
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_workspace_members_user'
        AND object_id = OBJECT_ID('[dbo].[workspace_members]')
      )
      BEGIN
        CREATE INDEX [IDX_workspace_members_user]
        ON [dbo].[workspace_members] ([user_id]);
      END
    `);

    // Index on activities (workspaceId, created_at)
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_activities_workspace_created'
        AND object_id = OBJECT_ID('[dbo].[activities]')
      )
      BEGIN
        CREATE INDEX [IDX_activities_workspace_created]
        ON [dbo].[activities] ([workspace_id], [created_at]);
      END
    `);

    // Seed default workspace 'twsbp'
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM [dbo].[workspaces] WHERE [slug] = 'twsbp')
      BEGIN
        INSERT INTO [dbo].[workspaces] ([id], [name], [slug], [is_active], [created_at], [updated_at])
        VALUES (NEWID(), 'Default Workspace', 'twsbp', 1, SYSDATETIME(), SYSDATETIME());
      END
    `);

    // Add Owner membership for platform admin (user 'admin') in default workspace
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM [dbo].[users] WHERE [username] = 'admin')
      AND EXISTS (SELECT 1 FROM [dbo].[workspaces] WHERE [slug] = 'twsbp')
      AND NOT EXISTS (
        SELECT 1 FROM [dbo].[workspace_members] wm
        INNER JOIN [dbo].[users] u ON wm.[user_id] = u.[id]
        INNER JOIN [dbo].[workspaces] w ON wm.[workspace_id] = w.[id]
        WHERE u.[username] = 'admin' AND w.[slug] = 'twsbp'
      )
      BEGIN
        DECLARE @workspaceId uniqueidentifier;
        DECLARE @adminUserId uniqueidentifier;
        SELECT @workspaceId = [id] FROM [dbo].[workspaces] WHERE [slug] = 'twsbp';
        SELECT @adminUserId = [id] FROM [dbo].[users] WHERE [username] = 'admin';
        INSERT INTO [dbo].[workspace_members] ([id], [workspace_id], [user_id], [role], [is_active], [joined_at])
        VALUES (NEWID(), @workspaceId, @adminUserId, 'Owner', 1, SYSDATETIME());
      END
    `);

    // Backfill activities for default workspace (optional: set workspaceId for existing activities)
    await queryRunner.query(`
      UPDATE a
      SET a.[workspace_id] = w.[id]
      FROM [dbo].[activities] a
      INNER JOIN [dbo].[workspaces] w ON w.[slug] = 'twsbp'
      WHERE a.[workspace_id] IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_activities_workspace_created'
        AND object_id = OBJECT_ID('[dbo].[activities]')
      )
      DROP INDEX [IDX_activities_workspace_created] ON [dbo].[activities];
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_workspace_members_user'
        AND object_id = OBJECT_ID('[dbo].[workspace_members]')
      )
      DROP INDEX [IDX_workspace_members_user] ON [dbo].[workspace_members];
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_workspace_members_workspace_role'
        AND object_id = OBJECT_ID('[dbo].[workspace_members]')
      )
      DROP INDEX [IDX_workspace_members_workspace_role] ON [dbo].[workspace_members];
    `);

    // Drop foreign keys
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_activities_workspace')
      ALTER TABLE [dbo].[activities] DROP CONSTRAINT [FK_activities_workspace];
    `);

    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_workspace_members_user')
      ALTER TABLE [dbo].[workspace_members] DROP CONSTRAINT [FK_workspace_members_user];
    `);

    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_workspace_members_workspace')
      ALTER TABLE [dbo].[workspace_members] DROP CONSTRAINT [FK_workspace_members_workspace];
    `);

    // Drop tables
    await queryRunner.query(
      `IF OBJECT_ID('[dbo].[workspace_members]', 'U') IS NOT NULL DROP TABLE [dbo].[workspace_members];`
    );
    await queryRunner.query(
      `IF OBJECT_ID('[dbo].[workspaces]', 'U') IS NOT NULL DROP TABLE [dbo].[workspaces];`
    );

    // Remove workspaceId column from activities
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[activities]')
        AND name = 'workspace_id'
      )
      BEGIN
        ALTER TABLE [dbo].[activities] DROP COLUMN [workspace_id];
      END
    `);
  }
}
