## ADDED Requirements

### Requirement: Persist Active Workspace

The system SHALL persist and retrieve the user's last active workspace for consistent post-login redirects.

#### Scenario: Set last active workspace on profile access

- WHEN a user successfully calls `GET /c/:slug/auth/profile` for a workspace they belong to
- THEN the system updates `users.last_active_workspace_id` to the resolved workspace id
- AND the update is idempotent and does not affect other user data

#### Scenario: Retrieve last active workspace at login

- WHEN a user logs in with valid credentials
- THEN the system checks `users.last_active_workspace_id`
- AND if the workspace exists, is active, and the user is still an active member, the system returns its slug as `activeWorkspaceSlug`
- AND if the workspace is invalid (inactive, user removed, or membership inactive), the system falls back to the first valid workspace membership
- AND if the user has no workspace memberships, the system returns `activeWorkspaceSlug: null`

#### Scenario: Clear invalid last active workspace

- WHEN the stored `last_active_workspace_id` references a workspace the user no longer belongs to or is inactive
- THEN the system clears the field (sets to NULL)
- AND selects a fallback workspace if any valid memberships exist
- AND returns the fallback slug as `activeWorkspaceSlug` or null if none exist

#### Scenario: Default workspace preference

- WHEN a user belongs to multiple workspaces and no valid last active workspace is set
- THEN the system prefers the workspace matching `DEFAULT_WORKSPACE_SLUG` environment variable if the user is a member
- AND otherwise selects the workspace with earliest `joinedAt` timestamp
- AND otherwise selects the first workspace by creation date
- AND returns the selected workspace's slug as `activeWorkspaceSlug`