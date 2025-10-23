## ADDED Requirements

### Requirement: Docker-based Development Environment

The system SHALL provide a complete development environment via Docker Compose for zero-setup local development.

#### Scenario: Quick start development

- **WHEN** developer clones repository and runs `docker-compose up`
- **THEN** all services start without manual dependency installation
- **AND** API runs on localhost:3000 with hot reload
- **AND** web app runs on localhost:5173 with hot reload
- **AND** database is automatically initialized

#### Scenario: Development with code changes

- **WHEN** developer modifies source code
- **THEN** changes are reflected immediately in running containers
- **AND** TypeScript compilation happens in containers
- **AND** browser auto-refreshes for web changes

### Requirement: Development Tool Integration

The system SHALL support common development tools within Docker containers.

#### Scenario: Running tests

- **WHEN** developer runs `docker-compose exec api npm test`
- **THEN** all tests execute in container environment
- **AND** test results are available in terminal
- **AND** coverage reports are generated

#### Scenario: Database management

- **WHEN** developer needs database access
- **THEN** database is accessible via `docker-compose exec db psql`
- **AND** database migrations can be run via container commands
- **AND** seed data can be reset via container commands

## MODIFIED Requirements

### Requirement: Local Development Setup

The development setup SHALL support both traditional and Docker-based workflows.

#### Scenario: Traditional setup

- **WHEN** developer prefers local Node.js installation
- **THEN** existing npm/pnpm scripts continue to work
- **AND** documentation covers both approaches
- **AND** Docker remains optional

#### Scenario: Docker setup

- **WHEN** developer chooses Docker approach
- **THEN** Node.js installation is not required
- **AND** all dependencies run in containers
- **AND** host machine remains clean
