import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityScope1698494400001 implements MigrationInterface {
  name = 'AddActivityScope1698494400001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add scope column to activities table
    await queryRunner.query(`
      ALTER TABLE "activities" 
      ADD COLUMN "scope" character varying NOT NULL DEFAULT 'user'
    `);

    // Create index on scope for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_scope" ON "activities" ("scope")
    `);

    // Create composite index on workspace_id and scope for workspace activity queries
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_workspace_scope" ON "activities" ("workspace_id", "scope")
    `);

    // Create composite index on owner_id and scope for user activity queries
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_owner_scope" ON "activities" ("owner_id", "scope")
    `);

    // Migrate existing data: set scope based on activity type
    await queryRunner.query(`
      UPDATE "activities" 
      SET "scope" = CASE 
        WHEN "type" IN ('member_added', 'member_removed', 'member_role_changed', 'member_status_changed', 
                        'workspace_created', 'workspace_updated', 'workspace_deactivated', 'workspace_activated') 
        THEN 'workspace'
        ELSE 'user'
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_activities_owner_scope"`);
    await queryRunner.query(`DROP INDEX "IDX_activities_workspace_scope"`);
    await queryRunner.query(`DROP INDEX "IDX_activities_scope"`);

    // Remove scope column
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "scope"`);
  }
}