import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceAuditFields20251028000001 implements MigrationInterface {
  name = 'AddWorkspaceAuditFields20251028000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add member_count column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[workspaces]')
        AND name = 'member_count'
      )
      BEGIN
        ALTER TABLE [dbo].[workspaces]
        ADD [member_count] int NOT NULL DEFAULT 0;
      END
    `);

    // Add created_by column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[workspaces]')
        AND name = 'created_by'
      )
      BEGIN
        ALTER TABLE [dbo].[workspaces]
        ADD [created_by] uniqueidentifier NULL;
      END
    `);

    // Add updated_by column
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[workspaces]')
        AND name = 'updated_by'
      )
      BEGIN
        ALTER TABLE [dbo].[workspaces]
        ADD [updated_by] uniqueidentifier NULL;
      END
    `);

    // Initialize member_count for existing workspaces
    await queryRunner.query(`
      UPDATE w
      SET w.[member_count] = (
        SELECT COUNT(*)
        FROM [dbo].[workspace_members] wm
        WHERE wm.[workspace_id] = w.[id]
        AND wm.[is_active] = 1
      )
      FROM [dbo].[workspaces] w;
    `);

    // Create index on member_count for performance
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_workspaces_member_count'
        AND object_id = OBJECT_ID('[dbo].[workspaces]')
      )
      BEGIN
        CREATE INDEX [IDX_workspaces_member_count]
        ON [dbo].[workspaces] ([member_count]);
      END
    `);

    // Create index on created_by for audit queries
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_workspaces_created_by'
        AND object_id = OBJECT_ID('[dbo].[workspaces]')
      )
      BEGIN
        CREATE INDEX [IDX_workspaces_created_by]
        ON [dbo].[workspaces] ([created_by]);
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_workspaces_created_by'
        AND object_id = OBJECT_ID('[dbo].[workspaces]')
      )
      DROP INDEX [IDX_workspaces_created_by] ON [dbo].[workspaces];
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IDX_workspaces_member_count'
        AND object_id = OBJECT_ID('[dbo].[workspaces]')
      )
      DROP INDEX [IDX_workspaces_member_count] ON [dbo].[workspaces];
    `);

    // Drop columns
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[workspaces]')
        AND name = 'updated_by'
      )
      BEGIN
        ALTER TABLE [dbo].[workspaces] DROP COLUMN [updated_by];
      END
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[workspaces]')
        AND name = 'created_by'
      )
      BEGIN
        ALTER TABLE [dbo].[workspaces] DROP COLUMN [created_by];
      END
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[dbo].[workspaces]')
        AND name = 'member_count'
      )
      BEGIN
        ALTER TABLE [dbo].[workspaces] DROP COLUMN [member_count];
      END
    `);
  }
}