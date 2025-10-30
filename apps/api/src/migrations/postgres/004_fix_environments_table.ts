import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixEnvironmentsTable1698494400004 implements MigrationInterface {
  name = 'FixEnvironmentsTable1698494400004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing table
    await queryRunner.query(`DROP TABLE IF EXISTS "environments" CASCADE`);

    // Recreate with correct structure
    await queryRunner.query(`
      CREATE TABLE "environments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "host" character varying NOT NULL,
        "port" integer NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "database" character varying NOT NULL,
        "connection_timeout" integer,
        "encrypt" boolean NOT NULL DEFAULT false,
        "connection_status" character varying NOT NULL DEFAULT 'unknown',
        "last_tested_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_environments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_environments_workspace_id" UNIQUE ("workspace_id"),
        CONSTRAINT "FK_environments_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_environments_workspace_id" ON "environments" ("workspace_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_environments_workspace_id"`);
    await queryRunner.query(`DROP TABLE "environments"`);
  }
}
