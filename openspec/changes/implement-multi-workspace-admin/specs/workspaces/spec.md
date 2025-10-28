## MODIFIED Requirements

### Requirement: Workspace Model

The system SHALL support a Workspace entity with unique `slug` and active status, creatable by Platform Admins through API endpoints.

#### Scenario: Create workspace

- WHEN a platform admin creates a workspace with a unique slug
- THEN the workspace is created and available via `/c/:slug/...`

#### Scenario: Platform Admin workspace creation via API

- WHEN a Platform Admin calls POST /admin/workspaces with valid workspace data
- THEN the system creates the workspace and assigns the creating admin as Owner
- AND returns the created workspace with its ID and slug

#### Scenario: Workspace creation validation

- WHEN creating a workspace with invalid slug format or duplicate slug
- THEN the system rejects with appropriate validation errors

#### Scenario: Duplicate slug rejected

- WHEN a workspace is created with an existing slug
- THEN the system rejects the operation with a validation error

#### Scenario: Deactivated workspace denies access

- WHEN a workspace is deactivated
- THEN all `/c/:slug/...` routes return 403 Forbidden to non‑platform‑admins

#### Scenario: List all workspaces for Platform Admin

- WHEN a Platform Admin calls GET /admin/workspaces
- THEN the system returns all workspaces with their member counts and status

#### Scenario: Update workspace details

- WHEN a Platform Admin calls PATCH /admin/c/:slug with valid updates
- THEN the system updates the workspace and returns the updated data

#### Scenario: Soft delete workspace

- WHEN a Platform Admin calls DELETE /admin/c/:slug
- THEN the system deactivates the workspace (soft delete)
- AND all workspace access is denied for non-platform-admins

#### Scenario: Reactivate workspace

- WHEN a Platform Admin calls POST /admin/c/:slug/activate
- THEN the system reactivates the workspace and restores access

### Requirement: Workspace Membership and Roles

The system SHALL support membership between a User and a Workspace with roles `Owner` | `Author` | `Member` and a per-membership active flag. The `Workspace Admin` role is removed.

#### Scenario: Add existing user to workspace

- WHEN an Owner calls POST /c/:slug/users with an existing `username` and a valid `role` (Owner/Author/Member)
- THEN the system creates a membership for that user in the workspace

#### Scenario: Create new user and add to workspace

- WHEN an Owner calls POST /c/:slug/users with a new `username`, `name`, `password`, and a valid `role`
- THEN the system creates a global user and adds a membership in the workspace

#### Scenario: Unique membership per user/workspace

- WHEN attempting to add a user already in the workspace
- THEN the system rejects the operation due to UNIQUE(workspaceId, userId)

#### Scenario: Last Owner protection

- WHEN updating role/status would result in zero Owners in the workspace
- THEN the system rejects the operation

#### Scenario: Platform Admin requires replacement Owner

- WHEN a Platform Admin performs a role/status change that would remove or deactivate the last Owner
- THEN the request MUST include `replacementOwnerUserId` to transfer ownership, otherwise the system rejects with 400 Bad Request

#### Scenario: Permissions by role

- WHEN a user has Owner role
- THEN they can manage workspace settings, members, and content within that workspace; they cannot access other workspaces unless a member there

- WHEN a user has Author role
- THEN they can create and edit content within that workspace; they cannot manage settings or members

- WHEN a user has Member role
- THEN they can view and participate within that workspace; they cannot create content or manage settings

## ADDED Requirements

### Requirement: Workspace Member Management for Owners and Platform Admins

The system SHALL allow workspace Owners and Platform Admins to manage members within workspaces, including adding users, changing roles, and deactivating members.

#### Scenario: Owner lists workspace members

- WHEN a workspace Owner calls GET /c/:slug/users
- THEN the system returns all members with their roles and status

#### Scenario: Platform Admin lists any workspace members

- WHEN a Platform Admin calls GET /admin/c/:slug/members
- THEN the system returns all members with their roles and status
- AND membership is not required for the Platform Admin

#### Scenario: Owner adds existing user to workspace

- WHEN a workspace Owner calls POST /c/:slug/users with existing username
- THEN the system creates a membership with the specified role

#### Scenario: Platform Admin adds user to any workspace

- WHEN a Platform Admin calls POST /admin/c/:slug/members with existing username
- THEN the system creates a membership with the specified role
- AND workspace membership is not required for the Platform Admin

#### Scenario: Owner creates new user and adds to workspace

- WHEN a workspace Owner calls POST /c/:slug/users with new user data
- THEN the system creates a new global user and adds membership to workspace

#### Scenario: Owner updates member role

- WHEN a workspace Owner calls PATCH /c/:slug/users/:userId/role
- THEN the system updates the member's role with last Owner protection

#### Scenario: Platform Admin updates member role

- WHEN a Platform Admin calls PATCH /admin/c/:slug/members/:userId/role
- THEN the system updates the member's role
- AND if this change would leave the workspace with zero Owners, the request MUST include `replacementOwnerUserId` to transfer ownership; otherwise the system rejects with 400 Bad Request

#### Scenario: Owner deactivates workspace member

- WHEN a workspace Owner calls PATCH /c/:slug/users/:userId/status
- THEN the system deactivates the membership with last Owner protection

#### Scenario: Platform Admin deactivates workspace member

- WHEN a Platform Admin calls PATCH /admin/c/:slug/members/:userId/status
- THEN the system deactivates the membership
- AND if this change would leave the workspace with zero Owners, the request MUST include `replacementOwnerUserId` to transfer ownership; otherwise the system rejects with 400 Bad Request




### Requirement: Enhanced Workspace Switching

The system SHALL provide an improved workspace selector that supports multiple workspaces with search and role indicators.

#### Scenario: User searches workspaces

- WHEN a user types in the workspace selector
- THEN workspaces are filtered by name and slug

#### Scenario: User sees workspace roles

- WHEN viewing the workspace selector
- THEN each workspace shows the user's role in that workspace

#### Scenario: Switch between workspaces

- WHEN a user selects a different workspace
- THEN the UI updates to show the new workspace context without re-authentication

#### Scenario: Platform Admin sees all workspaces

- WHEN a Platform Admin uses workspace selector
- THEN they see all workspaces in the system
- AND can switch to any workspace regardless of membership