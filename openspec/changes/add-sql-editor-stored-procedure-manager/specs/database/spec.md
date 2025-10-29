## MODIFIED Requirements

### Requirement: Multi-Database Support

The system SHALL support both PostgreSQL for application data and MSSQL for stored procedure execution.

#### Scenario: PostgreSQL connection for application data

- **WHEN** application accesses user data, workspaces, or activities
- **THEN** PostgreSQL database is used with existing TypeORM configuration
- **AND** all existing functionality remains unchanged
- **AND** migrations continue to work on PostgreSQL

#### Scenario: MSSQL connection for stored procedures

- **WHEN** SQL Editor executes stored procedures
- **THEN** MSSQL database connection is established separately
- **AND** MSSQL connection uses dedicated configuration and connection pool
- **AND** MSSQL credentials are read from the workspace environments table (environment variables may provide global defaults)
- **AND** connection health is monitored independently

#### Scenario: Connection isolation

- **WHEN** both databases are accessed
- **THEN** PostgreSQL and MSSQL connections are properly isolated
- **AND** connection failures in one database don't affect the other
- **AND** each connection pool is optimized for its specific workload

## ADDED Requirements

### Requirement: SQL Editor Database Schema

The system SHALL create new database tables in PostgreSQL to manage SQL Editor metadata while procedures execute in per‑workspace MSSQL environments.

#### Scenario: Procedure categories storage

- **WHEN** admin creates procedure categories
- **THEN** categories are stored in PostgreSQL database
- **AND** table includes id, name, description, position, created_by, created_at, updated_at
- **AND** categories have unique constraint on name
- **AND** `position` defines global ordering; an index on `position` optimizes sorting
- **AND** foreign key relationship to users table

#### Scenario: Procedure templates storage

- **WHEN** admin creates procedure templates
- **THEN** templates are stored in PostgreSQL database
- **AND** table includes id, name, category_id, parameters_json, created_by, created_at, updated_at
- **AND** parameters_json stores parameter definitions as JSON
- **AND** foreign key relationships to categories and users tables

#### Scenario: Stored procedures metadata storage

- **WHEN** users create stored procedures
- **THEN** procedure metadata is stored in PostgreSQL
- **AND** actual procedure code is deployed/executed in MSSQL
- **AND** table includes id, name, category_id, template_id, workspace_id, status, current_version_id, published_version_id, published_at, created_by, created_at, updated_at
- **AND** `status` is an enum with values: `draft` or `published`
- **AND** `current_version_id` and `published_version_id` reference ProcedureVersion (published may be null)
- **AND** unique constraint on (workspace_id, name)
- **AND** foreign key relationships to categories, templates, workspaces, and users tables

#### Scenario: Procedure versions storage

- **WHEN** procedures are modified
- **THEN** new versions are stored in PostgreSQL
- **AND** table includes id, procedure_id, version_number, sql_body, change_description, created_by, created_at
- **AND** `sql_body` stores the procedure body only (signature generated from template on publish)
- **AND** foreign key relationships to stored_procedures and users tables
- **AND** unique constraint on (procedure_id, version_number)
- **AND** index on (procedure_id, version_number) for history queries

#### Scenario: Parameter presets storage

- **WHEN** Owner or Author saves execution parameter presets
- **THEN** presets are stored in PostgreSQL
- **AND** table includes id, procedure_id, name, params_json, owner_id, created_at
- **AND** unique constraint on (procedure_id, owner_id, name)
- **AND** foreign key relationships to stored_procedures and users tables

#### Scenario: Procedure execution audit storage

- **WHEN** procedures are executed
- **THEN** an audit record is stored in PostgreSQL
- **AND** table includes id, procedure_id, version_id, workspace_id, actor_id, duration_ms, status, error_code, started_at, ended_at, params_redacted_json
- **AND** no result rows are stored; parameters are redacted before persistence
- **AND** foreign key relationships to stored_procedures, procedure_versions, workspaces, and users tables

### Requirement: Database Migration for SQL Editor

The system SHALL provide proper migration files for creating SQL Editor database schema.

#### Scenario: Initial migration creation

- **WHEN** SQL Editor module is first deployed
- **THEN** migration creates all required tables
- **AND** proper indexes are created for performance
- **AND** foreign key constraints are established
- **AND** unique constraints prevent data duplication

#### Scenario: Migration rollback support

- **WHEN** migration needs to be rolled back
- **THEN** all SQL Editor tables are safely dropped
- **AND** no orphaned data remains in related tables
- **AND** database returns to previous state without data loss

### Requirement: Data Integrity for SQL Editor

The system SHALL maintain data integrity for SQL Editor entities through proper constraints and relationships.

#### Scenario: Referential integrity

- **WHEN** related data is modified or deleted
- **THEN** foreign key constraints prevent orphaned records
- **AND** cascade deletes are configured appropriately
- **AND** data relationships remain consistent

#### Scenario: Unique constraints

- **WHEN** new entities are created
- **THEN** category names are unique within system
- **AND** procedure names are unique within workspace
- **AND** template names are unique within category
- **AND** appropriate errors are raised on violations

#### Scenario: Data validation

- **WHEN** entities are persisted
- **THEN** required fields are validated
- **AND** JSON fields are properly structured
- **AND** data types are enforced
- **AND** length limits are respected