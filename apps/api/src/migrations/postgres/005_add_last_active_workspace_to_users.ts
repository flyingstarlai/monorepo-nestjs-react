import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastActiveWorkspaceToUsers1698494400005 implements MigrationInterface {
  name = 'AddLastActiveWorkspaceToUsers1698494400005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add last_active_workspace_id column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "last_active_workspace_id" uuid NULL
    `);

    // Add foreign key constraint to workspaces table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_last_active_workspace" 
      FOREIGN KEY ("last_active_workspace_id") 
      REFERENCES "workspaces"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    // Add index for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_users_last_active_workspace" 
      ON "users"("last_active_workspace_id")
    `);

    // Optional: Add timestamp for auditing when workspace was last set as active
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "last_active_workspace_at" timestamp NULL DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns and constraints in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_last_active_workspace"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_last_active_workspace"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "last_active_workspace_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "last_active_workspace_id"`);
  }
}