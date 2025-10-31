import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoredProceduresVersionsTable1698494400007
  implements MigrationInterface
{
  name = 'AddStoredProceduresVersionsTable1698494400007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stored_procedure_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "procedure_id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "version" integer NOT NULL,
        "source" character varying NOT NULL,
        "name" character varying NOT NULL,
        "sql_text" text NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stored_procedure_versions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stored_procedure_versions_procedure_id" FOREIGN KEY ("procedure_id") REFERENCES "stored_procedures" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_stored_procedure_versions_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_stored_procedure_versions_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "UQ_stored_procedure_versions_procedure_version" UNIQUE ("procedure_id", "version")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_stored_procedure_versions_procedure_id" ON "stored_procedure_versions" ("procedure_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_stored_procedure_versions_workspace_id" ON "stored_procedure_versions" ("workspace_id")
    `);

    // Add check constraint for source enum
    await queryRunner.query(`
      ALTER TABLE "stored_procedure_versions" 
      ADD CONSTRAINT "CHK_stored_procedure_versions_source" 
      CHECK (source IN ('draft', 'published'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stored_procedure_versions" DROP CONSTRAINT "CHK_stored_procedure_versions_source"`
    );
    await queryRunner.query(`DROP INDEX "IDX_stored_procedure_versions_workspace_id"`);
    await queryRunner.query(`DROP INDEX "IDX_stored_procedure_versions_procedure_id"`);
    await queryRunner.query(`DROP TABLE "stored_procedure_versions"`);
  }
}