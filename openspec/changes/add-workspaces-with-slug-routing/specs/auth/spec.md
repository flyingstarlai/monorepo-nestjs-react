## ADDED Requirements

### Requirement: Login Unchanged (Global)

The system SHALL authenticate users with username and password via `POST /auth/login`. No self‑registration is provided.

#### Scenario: Successful login returns JWT

- WHEN valid credentials are posted to `/auth/login`
- THEN the system returns an access token and basic user info

#### Scenario: Invalid credentials

- WHEN invalid credentials are posted
- THEN the system responds with 401 Unauthorized

### Requirement: List User Workspaces

The system SHALL provide a list of workspaces the authenticated user belongs to.

#### Scenario: List memberships

- WHEN `GET /workspaces` is called with a valid JWT
- THEN the system returns `{ items: [{ id, name, slug, role, isActive }...] }`

### Requirement: Workspace‑Scoped Profile

The system SHALL provide a workspace‑scoped profile endpoint that returns the effective role within the selected workspace.

#### Scenario: Fetch profile for workspace

- WHEN `GET /c/:slug/auth/profile` is called with a valid JWT by a workspace member
- THEN the system returns the user profile including `{ username, name, avatar?, workspaceRole: 'Owner'|'Admin'|'Author'|'Member' }`

#### Scenario: Not a member

- WHEN `GET /c/:slug/auth/profile` is called by a user who is not a member of that workspace
- THEN the system responds with 403 Forbidden

#### Scenario: Platform admin access

- WHEN a platform admin calls `GET /c/:slug/auth/profile`
- THEN the system returns the profile and indicates effective access as platform admin (membership not required)
