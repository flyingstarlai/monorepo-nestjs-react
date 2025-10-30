# Workspaces

## Purpose

Define requirements for workspace configuration, environment management, and active workspace persistence.

## Requirements

### Requirement: Workspace Environment Configuration

Each workspace SHALL have its own MS SQL database environment configuration that can be managed by workspace Owners and Admins.

#### Scenario: Create environment configuration

- WHEN a workspace Owner or Admin provides valid MS SQL connection parameters
- THEN environment configuration is created for the workspace
- AND connection is tested before saving and success is indicated

#### Scenario: Update environment configuration

- WHEN a workspace Owner or Admin modifies existing environment configuration
- THEN configuration is updated after a successful connection test
- AND cached connections are refreshed

#### Scenario: View environment configuration

- WHEN a workspace member accesses Advanced Settings
- THEN current environment configuration and connection status are displayed
- AND edit controls are visible only to Owners and Admins

#### Scenario: Test database connection

- WHEN a user clicks "Test Connection"
- THEN system attempts to connect using provided parameters and shows success/failure with details

### Requirement: Environment Access Control

Environment configuration SHALL be restricted to workspace Owners and Admins only.

#### Scenario: Role-based access enforcement

- WHEN a Member attempts to access environment configuration
- THEN edit controls are disabled and a read‑only view is shown

#### Scenario: Unauthorized API access prevention

- WHEN a non‑Owner/Admin attempts to modify environment via API
- THEN request is rejected with 403 Forbidden status

### Requirement: MS SQL Connection Management

The system SHALL support MS SQL database connections with proper validation and error handling.

#### Scenario: Connection parameter validation

- WHEN environment configuration is submitted
- THEN required MS SQL parameters are validated (host, port, username, password, database)
- AND optional parameters have sane defaults (e.g., timeout, encrypt)

#### Scenario: Connection health monitoring

- WHEN workspace database connections are used
- THEN connection health is checked; failures trigger reconnection attempts; persistent failures are logged

#### Scenario: Connection pooling and caching

- WHEN multiple requests access the same workspace database
- THEN connections are reused from cache; pool limits enforced; idle connections closed

### Requirement: Environment Data Model

The system SHALL store environment configuration with proper data relationships and constraints.

#### Scenario: One-to-one workspace relationship

- WHEN environment configuration is created
- THEN it is uniquely associated with a single workspace; constraints prevent duplicates

#### Scenario: Credential storage

- WHEN environment configuration is saved
- THEN database credentials are stored in plain text (current design) and are accessible only to authorized users

#### Scenario: Environment lifecycle

- WHEN a workspace is deleted
- THEN associated environment configuration is also deleted and cached connections are closed

### Requirement: Persist Active Workspace

The system SHALL persist and retrieve the user's last active workspace for consistent post‑login redirects.

#### Scenario: Set last active workspace on profile access

- WHEN a user successfully calls `GET /c/:slug/auth/profile` for a workspace they belong to
- THEN the system updates `users.last_active_workspace_id` to the resolved workspace id idempotently

#### Scenario: Retrieve last active workspace at login

- WHEN a user logs in with valid credentials
- THEN the system returns `activeWorkspaceSlug` based on the last valid active workspace or a safe fallback

#### Scenario: Clear invalid last active workspace

- WHEN the stored last active workspace is invalid
- THEN the system clears it and selects a fallback if available

#### Scenario: Default workspace preference

- WHEN a user belongs to multiple workspaces with no valid last active workspace
- THEN the system prefers `DEFAULT_WORKSPACE_SLUG` if the user is a member; otherwise earliest joined; otherwise first by creation date
