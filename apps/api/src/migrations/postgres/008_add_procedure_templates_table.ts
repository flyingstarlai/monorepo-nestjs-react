import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcedureTemplatesTable1698494400008
  implements MigrationInterface
{
  name = 'AddProcedureTemplatesTable1698494400008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "procedure_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "sql_template" text NOT NULL,
        "params_schema" jsonb,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_procedure_templates_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_procedure_templates_name" UNIQUE ("name"),
        CONSTRAINT "FK_procedure_templates_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_procedure_templates_created_by" ON "procedure_templates" ("created_by")
    `);

    // Add check constraint for parameter schema structure
    await queryRunner.query(`
      ALTER TABLE "procedure_templates" 
      ADD CONSTRAINT "CHK_procedure_templates_sql_template_not_empty" 
      CHECK (length(trim(sql_template)) > 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procedure_templates" DROP CONSTRAINT "CHK_procedure_templates_sql_template_not_empty"`
    );
    await queryRunner.query(`DROP INDEX "IDX_procedure_templates_created_by"`);
    await queryRunner.query(`DROP TABLE "procedure_templates"`);
  }
}