## MODIFIED Requirements

### Requirement: User Profile Activity Recording

The system SHALL modify user profile update endpoints to record user-scoped activities instead of workspace-scoped activities.

#### Scenario: Profile update records user activity

- WHEN a user updates their profile via `PUT /users/profile`
- THEN the system records a `profile_updated` activity with scope `'user'`

#### Scenario: Avatar update records user activity

- WHEN a user updates their avatar via `PUT /users/avatar`
- THEN the system records an `avatar_updated` activity with scope `'user'`

#### Scenario: Password change records user activity

- WHEN a user changes their password via `PUT /users/password`
- THEN the system records a `password_changed` activity with scope `'user'`

### Requirement: Login Activity Recording

The system SHALL modify the login endpoint to record user-scoped login activities.

#### Scenario: Successful login records activity

- WHEN a user successfully authenticates via `POST /auth/login`
- THEN the system records a `login_success` activity with scope `'user'`

#### Scenario: Failed login does not record activity

- WHEN login fails due to invalid credentials
- THEN the system does not record any activity

### Requirement: Workspace Profile Endpoint

The system SHALL modify the workspace profile endpoint to return user-scoped activity counts separately from workspace activities.

#### Scenario: Profile returns activity separation

- WHEN `GET /c/:slug/auth/profile` is called
- THEN the system returns separate counts for user activities and workspace activities

#### Scenario: Profile excludes user activities from workspace context

- WHEN workspace profile is fetched
- THEN user activities are not included in workspace activity counts

## ADDED Requirements

### Requirement: User Activity Hook Integration

The system SHALL provide user activity data through authentication-related hooks for dashboard display.

#### Scenario: Dashboard fetches user activities

- WHEN the dashboard loads
- THEN the system uses `useUserActivities()` to fetch user-scoped activities

#### Scenario: User activities update on profile changes

- WHEN a user updates their profile
- THEN the user activities feed reflects the change immediately

### Requirement: Activity Scope Validation

The system SHALL validate that user profile activities are always recorded with user scope regardless of workspace context.

#### Scenario: Profile update in workspace context

- WHEN a user updates their profile while in a workspace
- THEN the activity is still recorded with scope `'user'` not `'workspace'`

#### Scenario: Activity scope enforcement

- WHEN an activity recording attempt specifies wrong scope for user profile actions
- THEN the system overrides to use `'user'` scope and logs the correction