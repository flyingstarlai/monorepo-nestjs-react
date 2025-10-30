import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoredProceduresTable1698494400006
  implements MigrationInterface
{
  name = 'AddStoredProceduresTable1698494400006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stored_procedures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'draft',
        "sql_draft" text NOT NULL,
        "sql_published" text,
        "published_at" TIMESTAMP,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stored_procedures_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stored_procedures_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_stored_procedures_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "UQ_stored_procedures_workspace_name" UNIQUE ("workspace_id", "name")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_stored_procedures_workspace_id" ON "stored_procedures" ("workspace_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_stored_procedures_updated_at" ON "stored_procedures" ("updated_at")
    `);

    // Add check constraint for status enum
    await queryRunner.query(`
      ALTER TABLE "stored_procedures" 
      ADD CONSTRAINT "CHK_stored_procedures_status" 
      CHECK (status IN ('draft', 'published'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stored_procedures" DROP CONSTRAINT "CHK_stored_procedures_status"`
    );
    await queryRunner.query(`DROP INDEX "IDX_stored_procedures_updated_at"`);
    await queryRunner.query(`DROP INDEX "IDX_stored_procedures_workspace_id"`);
    await queryRunner.query(`DROP TABLE "stored_procedures"`);
  }
}
