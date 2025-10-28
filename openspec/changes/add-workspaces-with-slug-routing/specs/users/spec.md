## ADDED Requirements

### Requirement: Workspace User Management

Workspace Owners/Admins SHALL be able to add existing users or create new users and add them to their workspace via `/c/:slug/users` endpoints. No self‑registration is permitted.

#### Scenario: Add existing user by username

- WHEN `POST /c/:slug/users` is called with an existing `username` and a valid `role` (Owner/Admin/Author/Member)
- THEN the system creates a membership for that user in the workspace

#### Scenario: Create new user and add to workspace

- WHEN `POST /c/:slug/users` is called with a new `username`, `name`, `password`, and a valid `role`
- THEN the system creates a global user (username globally unique) and adds a membership in the workspace

#### Scenario: Reject invalid role

- WHEN `POST /c/:slug/users` is called with a role outside Owner/Admin/Author/Member
- THEN the system rejects the request with 400 Bad Request

#### Scenario: Non‑admin forbidden

- WHEN a Member/Author calls `POST /c/:slug/users`
- THEN the system responds with 403 Forbidden

### Requirement: Membership Role Management

Owners/Admins SHALL be able to update a member's workspace role via `PATCH /c/:slug/users/:id/role` with last‑Owner protection.

#### Scenario: Update role success

- WHEN updating a member role to Admin/Author/Member by an Owner/Admin
- THEN the system updates the membership role

#### Scenario: Prevent demoting last Owner

- WHEN updating the only Owner to a lower role
- THEN the system rejects the operation

#### Scenario: Platform admin override

- WHEN a platform admin performs the same demotion
- THEN the operation is allowed

### Requirement: Membership Status Management

Owners/Admins SHALL be able to activate or deactivate a member within the workspace via `PATCH /c/:slug/users/:id/status`.

#### Scenario: Deactivate member

- WHEN an Owner/Admin deactivates a member
- THEN the member loses access to `/c/:slug/...` routes for that workspace

#### Scenario: Prevent disabling last Owner

- WHEN deactivating the only Owner
- THEN the system rejects the operation
