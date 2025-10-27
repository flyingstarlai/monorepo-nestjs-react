## ADDED Requirements

### Requirement: Workspace Routing and Resolution

The system SHALL identify the active workspace via the URL path prefix `/c/:slug/` for all workspace‑scoped API endpoints and pages.

#### Scenario: Resolve existing workspace by slug
- WHEN a request targets `GET /c/acme/users`
- THEN the system resolves `acme` to the corresponding workspace and processes the request

#### Scenario: Unknown workspace slug returns 404
- WHEN a request targets `/c/unknown-slug/...`
- THEN the system responds with 404 Not Found

#### Scenario: Membership required
- WHEN a non‑member user requests `GET /c/acme/users`
- THEN the system responds with 403 Forbidden

#### Scenario: Platform admin bypass
- WHEN a platform admin requests any `/c/:slug/...` route
- THEN the system authorizes the request regardless of membership

### Requirement: Workspace Model

The system SHALL support a Workspace entity with unique `slug` and active status.

#### Scenario: Create workspace
- WHEN a platform admin creates a workspace with a unique slug
- THEN the workspace is created and available via `/c/:slug/...`

#### Scenario: Duplicate slug rejected
- WHEN a workspace is created with an existing slug
- THEN the system rejects the operation with a validation error

#### Scenario: Deactivated workspace denies access
- WHEN a workspace is deactivated
- THEN all `/c/:slug/...` routes return 403 Forbidden to non‑platform‑admins

### Requirement: Workspace Membership and Roles

The system SHALL support membership between a User and a Workspace with roles `Owner` | `Admin` | `Author` | `Member` and a per‑membership active flag.

#### Scenario: Add existing user to workspace
- WHEN an Owner/Admin adds an existing username to the workspace
- THEN the system creates a membership with the specified role (default `Member` if unspecified)

#### Scenario: Create new user and add to workspace
- WHEN an Owner/Admin provides username, name, and password
- THEN the system creates a new global user and adds a membership to the workspace

#### Scenario: Unique membership per user/workspace
- WHEN attempting to add a user already in the workspace
- THEN the system rejects the operation due to UNIQUE(workspaceId, userId)

#### Scenario: Last Owner protection
- WHEN updating role/status would result in zero Owners in the workspace
- THEN the system rejects the operation

#### Scenario: Platform admin override
- WHEN a platform admin performs the same role/status change
- THEN the operation is allowed even if it would otherwise be blocked

### Requirement: Workspace Switching Without Re‑Authentication

The system SHALL allow switching workspaces by changing the `:slug` in the path without re‑authentication.

#### Scenario: Switch workspaces via path
- WHEN a logged‑in user changes from `/c/acme/dashboard` to `/c/umbrella/dashboard`
- THEN the system loads data for the `umbrella` workspace if the user is a member
