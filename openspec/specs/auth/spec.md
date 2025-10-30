# Authentication

## Purpose

Define requirements for authentication flows and workspace‑scoped profile behavior.

## Requirements

### Requirement: Login Unchanged (Global)

The system SHALL authenticate users with username and password via `POST /auth/login`.

#### Scenario: Successful login returns JWT and active workspace slug

- WHEN valid credentials are posted to `/auth/login`
- THEN system returns an access token, basic user info, and the user's last active workspace slug if available and valid
- AND if the last active workspace is invalid, the system returns the first valid workspace slug or null if no memberships

#### Scenario: Invalid credentials

- WHEN invalid credentials are posted
- THEN system responds with 401 Unauthorized

### Requirement: List User Workspaces

The system SHALL provide a list of workspaces authenticated user belongs to.

#### Scenario: List memberships

- WHEN `GET /workspaces` is called with a valid JWT
- THEN system returns `{ items: [{ id, name, slug, role, isActive }...] }`

### Requirement: Workspace‑Scoped Profile

The system SHALL provide a workspace‑scoped profile endpoint that returns effective role within the selected workspace and persists the last active workspace.

#### Scenario: Fetch profile for workspace

- WHEN `GET /c/:slug/auth/profile` is called with a valid JWT by a workspace member
- THEN system returns user profile including `{ username, name, avatar?, workspaceRole }`
- AND system updates the user's last active workspace to this workspace

#### Scenario: Not a member

- WHEN `GET /c/:slug/auth/profile` is called by a user who is not a member of that workspace
- THEN system responds with 403 Forbidden and does not update last active workspace

#### Scenario: Platform admin access

- WHEN a platform admin calls `GET /c/:slug/auth/profile`
- THEN system returns profile and indicates effective access as platform admin and updates last active workspace
