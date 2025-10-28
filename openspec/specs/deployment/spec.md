# Deployment

## Purpose

Define requirements for deploying the dashboard application using containerized environments.

## Requirements

### Requirement: Container-based Deployment

The system SHALL support deployment via Docker containers for both development and production environments.

#### Scenario: Development container startup

- **WHEN** developer runs `docker-compose up`
- **THEN** both API and web services start with hot reload enabled
- **AND** PostgreSQL database starts with persistent data
- **AND** database runs migrations and seeds automatically
- **AND** services are accessible on localhost:3000 (API) and localhost:5173 (web)

#### Scenario: Production container deployment

- **WHEN** operator runs `docker-compose -f docker-compose.prod.yml up -d`
- **THEN** optimized production images start
- **AND** PostgreSQL database persists data with proper configuration
- **AND** services run without development dependencies
- **AND** database migrations run automatically on startup
- **AND** health checks monitor service status

### Requirement: Cross-platform Build Support

The system SHALL support building Docker images for Linux AMD64 architecture from any development platform.

#### Scenario: Building from macOS/Windows

- **WHEN** developer runs `./build-docker.sh`
- **THEN** images are compiled for Linux AMD64 target
- **AND** build process uses cross-compilation
- **AND** final images can run on Linux servers

### Requirement: Database Containerization

The system SHALL provide PostgreSQL database via Docker container for production deployments.

#### Scenario: Database initialization

- **WHEN** PostgreSQL database container starts first time
- **THEN** TypeORM migrations run automatically
- **AND** seed data creates default users (admin/user)
- **AND** default workspace 'twsbp' is created with memberships
- **AND** database persists across container restarts

#### Scenario: Database persistence

- **WHEN** application containers are restarted
- **THEN** database data remains intact
- **AND** volume mounts ensure data persistence
- **AND** backups can be created from mounted volumes

### Requirement: Environment Configuration

The system SHALL support environment-specific configuration through Docker environment variables.

#### Scenario: Development environment

- **WHEN** using docker-compose.yml
- **THEN** PostgreSQL database container is used with development settings
- **AND** development environment variables are loaded (DB_DATABASE=tc_studio)
- **AND** hot reload and debugging features are enabled
- **AND** database runs with migrationsRun: false for manual control

#### Scenario: Production environment

- **WHEN** using docker-compose.prod.yml
- **THEN** PostgreSQL database is used with production settings
- **AND** production environment variables are required
- **AND** development features are disabled
- **AND** database runs with optimized connection pooling

### Requirement: Application Startup

The application SHALL support startup in containerized environments with proper health checks and graceful shutdown.

#### Scenario: Container health check

- **WHEN** Docker performs health check
- **THEN** API responds to `/health` endpoint
- **AND** web application loads successfully
- **AND** database connection is verified

#### Scenario: Graceful shutdown

- **WHEN** container receives SIGTERM
- **THEN** application closes database connections
- **AND** in-progress requests complete
- **AND** process exits cleanly
