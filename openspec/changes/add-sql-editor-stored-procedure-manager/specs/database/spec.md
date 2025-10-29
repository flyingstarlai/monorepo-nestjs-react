## MODIFIED Requirements

### Requirement: Multi-Database Support

The system SHALL use PostgreSQL for application data and SQL Editor metadata, and MSSQL for deploying and executing stored procedures.

#### Scenario: PostgreSQL for application and metadata

- **WHEN** the application stores users, workspaces, activities, or SQL Editor metadata
- **THEN** the PostgreSQL database is used with existing TypeORM configuration
- **AND** existing migrations and behavior remain unchanged

#### Scenario: MSSQL for stored procedures with isolation

- **WHEN** publishing or executing a stored procedure
- **THEN** a separate MSSQL connection (per workspace) is used
- **AND** connection pools and failures are isolated from PostgreSQL

## ADDED Requirements

### Requirement: SQL Editor Minimal Schema

The system SHALL persist stored procedure metadata in PostgreSQL without versions, categories, templates, presets, or audits.

#### Scenario: StoredProcedure table with draft/published columns

- **WHEN** creating or updating a stored procedure
- **THEN** a single `stored_procedures` table includes: `id`, `workspace_id`, `name`, `status` (`'draft'|'published'`), `sql_draft` (text), `sql_published` (text, nullable), `published_at` (timestamp, nullable), `created_by`, `created_at`, `updated_at`
- **AND** `(workspace_id, name)` is unique
- **AND** foreign keys reference `workspaces` and `users`
- **AND** indexes support queries by `workspace_id` and `updated_at`

### Requirement: Database Migration for SQL Editor

The system SHALL provide migrations for creating and rolling back the minimal schema.

#### Scenario: Initial migration and rollback

- **WHEN** the SQL Editor module is first deployed
- **THEN** the migration creates `stored_procedures` with the columns and constraints above
- **AND** a down migration drops the table safely with no orphaned data

### Requirement: Data Integrity for SQL Editor

The system SHALL enforce referential and uniqueness constraints for stored procedures.

#### Scenario: Referential and uniqueness constraints

- **WHEN** data is persisted
- **THEN** foreign keys prevent orphan records
- **AND** `unique(workspace_id, name)` prevents duplicates
- **AND** basic length/type validations are enforced by the ORM/migrations
