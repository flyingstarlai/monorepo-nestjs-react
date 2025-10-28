import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeDatabase20251028000000 implements MigrationInterface {
  name = 'InitializeDatabase20251028000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "username" character varying NOT NULL,
        "name" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role_id" uuid,
        "avatar" text,
        "email" character varying(255),
        "phone" character varying(50),
        "bio" text,
        "date_of_birth" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Create workspaces table
    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "member_count" integer NOT NULL DEFAULT 0,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_workspaces_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_workspaces" PRIMARY KEY ("id")
      )
    `);

    // Create workspace_members table
    await queryRunner.query(`
      CREATE TABLE "workspace_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspace_members_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_workspace_members_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create activities table
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "message" character varying NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities" PRIMARY KEY ("id"),
        CONSTRAINT "FK_activities_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_activities_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_activities_owner_id_created_at" ON "activities" ("owner_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_workspace_id_created_at" ON "activities" ("workspace_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_workspaces_slug" ON "workspaces" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_workspace_members_workspace_id_role" ON "workspace_members" ("workspace_id", "role")`);
    await queryRunner.query(`CREATE INDEX "IDX_workspace_members_user_id" ON "workspace_members" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_workspace_members_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_workspace_members_workspace_id_role"`);
    await queryRunner.query(`DROP INDEX "IDX_workspaces_slug"`);
    await queryRunner.query(`DROP INDEX "IDX_activities_workspace_id_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_activities_owner_id_created_at"`);
    await queryRunner.query(`DROP TABLE "activities"`);
    await queryRunner.query(`DROP TABLE "workspace_members"`);
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}