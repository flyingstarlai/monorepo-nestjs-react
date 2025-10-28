## MODIFIED Requirements

### Requirement: Workspace User Management

Workspace Owners SHALL be able to add existing users or create new users and add them to their workspace via `/c/:slug/users` endpoints. No self‑registration is permitted.

#### Scenario: Add existing user by username

- WHEN `POST /c/:slug/users` is called with an existing `username` and a valid `role` (Owner/Author/Member)
- THEN the system creates a membership for that user in the workspace

#### Scenario: Create new user and add to workspace

- WHEN `POST /c/:slug/users` is called with a new `username`, `name`, `password`, and a valid `role`
- THEN the system creates a global user (username globally unique) and adds a membership in the workspace

#### Scenario: Reject invalid role

- WHEN `POST /c/:slug/users` is called with a role outside Owner/Author/Member
- THEN the system rejects the request with 400 Bad Request

#### Scenario: Non‑Owner forbidden

- WHEN a Member/Author calls `POST /c/:slug/users`
- THEN the system responds with 403 Forbidden

## ADDED Requirements

### Requirement: Global User Creation With Optional Workspace Assignment

Platform Admins SHALL be able to create users globally and optionally assign them to a workspace during creation.

#### Scenario: Create user (Platform Admin only)

- WHEN a Platform Admin calls `POST /users` with `username`, `name`, and `password`
- THEN the system creates the global user

#### Scenario: Default workspace assignment when unspecified

- WHEN a Platform Admin omits workspace assignment
- THEN the system attempts to add the user to the default workspace (configured via `DEFAULT_WORKSPACE_SLUG`) as `Member`
- AND IF the default workspace is missing or inactive, the system SKIPS workspace assignment without error

#### Scenario: Create user with specific workspace assignment

- WHEN a Platform Admin provides `workspaceId` and a valid workspace `role` (Owner/Author/Member)
- THEN the system creates the global user and adds them to the specified workspace with the specified role

#### Scenario: Create user without workspace assignment

- WHEN a Platform Admin sets no workspace assignment and default workspace is not desired
- THEN the system creates the global user without any workspace membership

#### Scenario: Validation of workspace assignment

- WHEN `workspaceId` does not exist
- THEN the system responds with 404 Not Found

- WHEN `role` is outside Owner/Author/Member
- THEN the system responds with 400 Bad Request