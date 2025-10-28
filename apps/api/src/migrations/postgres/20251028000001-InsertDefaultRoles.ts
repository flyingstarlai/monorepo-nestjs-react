import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertDefaultRoles20251028000001 implements MigrationInterface {
  name = 'InsertDefaultRoles20251028000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at") 
      VALUES 
        (gen_random_uuid(), 'Admin', 'System administrator with full access', now(), now()),
        (gen_random_uuid(), 'User', 'Regular user with standard access', now(), now())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "roles" WHERE "name" IN ('Admin', 'User')`);
  }
}