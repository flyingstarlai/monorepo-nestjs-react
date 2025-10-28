import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveWorkspaceAdminRoleMSSQL20251028000002 implements MigrationInterface {
  name = 'RemoveWorkspaceAdminRoleMSSQL20251028000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing check constraint
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.check_constraints 
        WHERE name = 'CK_workspace_members_role_1' 
        AND parent_object_id = OBJECT_ID('[dbo].[workspace_members]')
      )
      BEGIN
        ALTER TABLE [dbo].[workspace_members] 
        DROP CONSTRAINT [CK_workspace_members_role_1];
      END
    `);

    // Add new check constraint without Admin role
    await queryRunner.query(`
      ALTER TABLE [dbo].[workspace_members]
      ADD CONSTRAINT [CK_workspace_members_role] 
      CHECK ([role] IN ('Owner','Author','Member'));
    `);

    // Update existing Admin workspace members to Author
    await queryRunner.query(`
      UPDATE [dbo].[workspace_members]
      SET [role] = 'Author'
      WHERE [role] = 'Admin';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the current check constraint
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.check_constraints 
        WHERE name = 'CK_workspace_members_role' 
        AND parent_object_id = OBJECT_ID('[dbo].[workspace_members]')
      )
      BEGIN
        ALTER TABLE [dbo].[workspace_members] 
        DROP CONSTRAINT [CK_workspace_members_role];
      END
    `);

    // Add back the original check constraint with Admin role
    await queryRunner.query(`
      ALTER TABLE [dbo].[workspace_members]
      ADD CONSTRAINT [CK_workspace_members_role_1] 
      CHECK ([role] IN ('Owner','Admin','Author','Member'));
    `);

    // Note: We don't automatically revert Author back to Admin as that could be destructive
    // This would need to be handled manually if needed
  }
}