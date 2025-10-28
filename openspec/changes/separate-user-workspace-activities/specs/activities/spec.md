## ADDED Requirements

### Requirement: Activity Scope Field

The system SHALL add a `scope` field to the Activity entity with enum values `'user' | 'workspace'` to distinguish between user-specific and workspace-specific activities.

#### Scenario: Create user-scoped activity

- WHEN an activity is recorded with `scope: 'user'`
- THEN the system stores the activity with user scope and excludes it from workspace activity queries

#### Scenario: Create workspace-scoped activity

- WHEN an activity is recorded with `scope: 'workspace'`
- THEN the system stores the activity with workspace scope and includes it in workspace activity queries

### Requirement: User Activity Types

The system SHALL support user-specific activity types: `profile_updated`, `login_success`, `password_changed`, `avatar_updated`.

#### Scenario: Record profile update activity

- WHEN a user updates their profile
- THEN the system records an activity with type `profile_updated` and scope `'user'`

#### Scenario: Record login activity

- WHEN a user successfully logs in
- THEN the system records an activity with type `login_success` and scope `'user'`

### Requirement: Workspace Activity Types

The system SHALL support workspace-specific activity types: `member_joined`, `member_removed`, `role_changed`, `workspace_settings_updated`.

#### Scenario: Record member joined activity

- WHEN a user joins a workspace
- THEN the system records an activity with type `member_joined` and scope `'workspace'`

#### Scenario: Record role changed activity

- WHEN a member's role is changed in a workspace
- THEN the system records an activity with type `role_changed` and scope `'workspace'`

### Requirement: Scoped Activity Queries

The system SHALL provide separate query methods for user and workspace activities.

#### Scenario: Query user activities only

- WHEN `findByOwner()` is called
- THEN the system returns only activities with scope `'user'` for the specified user

#### Scenario: Query workspace activities only

- WHEN `findByWorkspace()` is called
- THEN the system returns only activities with scope `'workspace'` for the specified workspace

## MODIFIED Requirements

### Requirement: Activity Recording Method

The system SHALL modify the `record()` method to accept an optional `scope` parameter and default to appropriate scope based on activity type.

#### Scenario: Record activity with explicit scope

- WHEN `record()` is called with explicit `scope` parameter
- THEN the system stores the activity with the specified scope

#### Scenario: Record activity with inferred scope

- WHEN `record()` is called without `scope` parameter
- THEN the system infers scope from activity type (user types → 'user', workspace types → 'workspace')

### Requirement: Workspace Activity Query

The system SHALL modify `findByWorkspaceAndOwner()` to filter by both workspace and scope parameters.

#### Scenario: Query user activities in workspace context

- WHEN `findByWorkspaceAndOwner()` is called with scope `'user'`
- THEN the system returns user activities that occurred within the workspace context

#### Scenario: Query workspace activities by owner

- WHEN `findByWorkspaceAndOwner()` is called with scope `'workspace'`
- THEN the system returns workspace activities initiated by the specified user

### Requirement: Activity Feed API

The system SHALL modify activities endpoints to use appropriate scoped methods based on context.

#### Scenario: Global activities endpoint

- WHEN `GET /activities` is called
- THEN the system returns user-scoped activities for the authenticated user

#### Scenario: Workspace activities endpoint

- WHEN `GET /c/:slug/activities` is called
- THEN the system returns workspace-scoped activities for the specified workspace

## REMOVED Requirements

### Requirement: Mixed Activity Queries

The system SHALL remove the ability to query activities without scope specification.

#### Scenario: Legacy activity query fails

- WHEN an activity query is made without scope specification
- THEN the system requires explicit scope parameter and rejects ambiguous queries