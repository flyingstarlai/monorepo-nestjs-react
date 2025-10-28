# Database Setup and Management

## Purpose

Define requirements for database setup, migrations, seeding, and management for the TC Studio application using PostgreSQL.

## Requirements

### Requirement: PostgreSQL Database Configuration

The system SHALL use PostgreSQL as the primary database with proper configuration for development and production environments.

#### Scenario: Development database setup

- **WHEN** developer sets up local development environment
- **THEN** PostgreSQL database runs on localhost:5432
- **AND** database name is 'tc_studio'
- **AND** default user is 'postgres' with configurable password
- **AND** connection uses TypeORM with PostgreSQL driver

#### Scenario: Production database setup

- **WHEN** deploying to production
- **THEN** PostgreSQL database uses environment-specific configuration
- **AND** connection pooling is enabled for performance
- **AND** SSL connections are used when available
- **AND** database credentials are secured via environment variables

#### Scenario: Database type detection

- **WHEN** application starts
- **THEN** system detects DB_TYPE from environment (defaults to 'postgres')
- **AND** appropriate TypeORM configuration is applied
- **AND** migrations run automatically based on configuration

### Requirement: Database Migrations

The system SHALL support automated database schema migrations using TypeORM.

#### Scenario: Migration execution

- **WHEN** `npm run migration:run` is executed
- **THEN** all pending migrations are applied in order
- **AND** migration history is tracked in 'migrations' table
- **AND** database schema is updated to latest version

#### Scenario: Migration rollback

- **WHEN** `npm run migration:revert` is executed
- **THEN** last applied migration is safely reverted
- **AND** data integrity is maintained
- **AND** migration history is updated

#### Scenario: Migration generation

- **WHEN** `npm run migration:generate` is executed with entity changes
- **THEN** new migration file is generated with proper SQL
- **AND** migration includes both 'up' and 'down' operations
- **AND** file follows naming convention (001_migration_name.ts)

### Requirement: Database Seeding

The system SHALL provide comprehensive database seeding for development and testing environments.

#### Scenario: Initial seeding

- **WHEN** `pnpm run db:seed` is executed on empty database
- **THEN** default roles (Admin, User) are created
- **AND** admin user (username: 'admin') is created with Admin role
- **AND** regular user (username: 'user') is created with User role
- **AND** default workspace 'twsbp' is created
- **AND** admin user is assigned as Owner of default workspace
- **AND** regular user is assigned as Member of default workspace

#### Scenario: Idempotent seeding

- **WHEN** seeding is executed on existing data
- **THEN** no duplicate records are created
- **AND** existing users remain unchanged
- **AND** existing workspaces remain unchanged
- **AND** existing memberships remain unchanged

#### Scenario: Workspace auto-creation

- **WHEN** seeding runs and default workspace 'twsbp' does not exist
- **THEN** workspace is created with name 'TWSBP' and slug 'twsbp'
- **AND** admin user is set as creator and Owner
- **AND** workspace member count is properly initialized

#### Scenario: Standalone seeding

- **WHEN** `pnpm run db:seed` is executed independently
- **THEN** seeding runs without full database reset
- **AND** only missing entities are created
- **AND** existing data is preserved

### Requirement: Database Reset and Management

The system SHALL provide database reset functionality for development environments.

#### Scenario: Full database reset

- **WHEN** `pnpm run db:reset` is executed
- **THEN** all tables are dropped and recreated
- **AND** all migrations are re-applied
- **AND** seeding is executed after migrations
- **AND** database returns to clean state with default data

#### Scenario: Database connection validation

- **WHEN** application starts
- **THEN** database connection is validated
- **AND** appropriate error is thrown if connection fails
- **AND** application retries connection with exponential backoff

### Requirement: Performance Optimization

The system SHALL optimize database performance for production workloads.

#### Scenario: Connection pooling

- **WHEN** application runs in production
- **THEN** database connection pool is configured
- **AND** pool size is optimized for expected load
- **AND** connection timeout is properly configured
- **AND** idle connections are efficiently managed

#### Scenario: Query optimization

- **WHEN** database queries are executed
- **THEN** appropriate indexes are used
- **AND** query plans are optimized
- **AND** N+1 query problems are avoided
- **AND** pagination is implemented for large datasets

#### Scenario: Database monitoring

- **WHEN** application is running with observability
- **THEN** database metrics are collected
- **AND** slow queries are identified and logged
- **AND** connection pool status is monitored
- **AND** database size and growth are tracked

### Requirement: Data Integrity and Constraints

The system SHALL maintain data integrity through proper constraints and relationships.

#### Scenario: Unique constraints

- **WHEN** data is inserted or updated
- **THEN** username uniqueness is enforced globally
- **AND** workspace slug uniqueness is enforced
- **AND** user-workspace membership uniqueness is enforced
- **AND** appropriate errors are raised on violations

#### Scenario: Foreign key constraints

- **WHEN** related data is modified
- **THEN** foreign key relationships are maintained
- **AND** cascade deletes are properly configured
- **AND** orphaned records are prevented
- **AND** referential integrity is preserved

#### Scenario: Data validation

- **WHEN** entities are persisted
- **THEN** required fields are validated
- **AND** data types are enforced
- **AND** string length limits are respected
- **AND** enum values are validated

### Requirement: Backup and Recovery

The system SHALL support database backup and recovery procedures.

#### Scenario: Automated backups

- **WHEN** backup scripts are scheduled
- **THEN** complete database backups are created
- **AND** backup files are compressed and stored
- **AND** backup retention policy is enforced
- **AND** backup success/failure is logged

#### Scenario: Point-in-time recovery

- **WHEN** database recovery is needed
- **THEN** backups can be restored to specific point in time
- **AND** data consistency is verified after restore
- **AND** application can reconnect successfully
- **AND** minimal downtime is achieved

### Requirement: Security

The system SHALL implement database security best practices.

#### Scenario: Access control

- **WHEN** database connections are made
- **THEN** least privilege principle is followed
- **AND** application user has minimal required permissions
- **AND** administrative access is restricted
- **AND** connection attempts are logged

#### Scenario: Data encryption

- **WHEN** sensitive data is stored
- **THEN** passwords are properly hashed
- **AND** encryption keys are managed securely
- **AND** data in transit is encrypted (SSL/TLS)
- **AND** encryption at rest is available when configured

#### Scenario: SQL injection prevention

- **WHEN** database queries are executed
- **THEN** parameterized queries are used
- **AND** user input is properly sanitized
- **AND** ORM protections are leveraged
- **AND** raw SQL is avoided when possible