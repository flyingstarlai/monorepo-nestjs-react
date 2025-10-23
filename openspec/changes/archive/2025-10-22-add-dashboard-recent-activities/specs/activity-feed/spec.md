## ADDED Requirements

### Requirement: User Recent Activities Feed

The system SHALL provide a per-user recent activities feed visible on the dashboard and retrievable via an authenticated API.

#### Scenario: Fetch recent activities succeeds

- **WHEN** the authenticated user requests `GET /activities` without parameters
- **THEN** the system returns up to 20 most recent activities for that user ordered by newest first

#### Scenario: Pagination with cursor

- **WHEN** the user requests `GET /activities?cursor=<cursor>&limit=10`
- **THEN** the system returns at most 10 activities created before the cursor and provides `nextCursor` if more exist

#### Scenario: Unauthorized access

- **WHEN** a request to `GET /activities` is made without a valid JWT
- **THEN** the system responds with 401 Unauthorized

### Requirement: Activity Event Recording (Self)

The system SHALL record activity events for self-initiated account actions.

#### Scenario: Login success recorded

- **WHEN** a user logs in successfully
- **THEN** the system records an activity with type `login_success` and a short success message for that user

#### Scenario: Profile updated recorded

- **WHEN** a user updates their profile successfully
- **THEN** the system records an activity with type `profile_updated`

#### Scenario: Password changed recorded

- **WHEN** a user changes their password successfully
- **THEN** the system records an activity with type `password_changed`

#### Scenario: Avatar updated recorded

- **WHEN** a user updates their avatar successfully
- **THEN** the system records an activity with type `avatar_updated`

### Requirement: Dashboard UI Integration

The dashboard SHALL display a Recent Activity card using live data with resilient UX.

#### Scenario: Loading state shown

- **WHEN** the activity list is being fetched
- **THEN** the dashboard shows a loading placeholder/skeleton in the Recent Activity card

#### Scenario: Empty state shown

- **WHEN** the user has no recorded activities
- **THEN** the dashboard shows a friendly empty state instead of placeholders

#### Scenario: Error fallback shown

- **WHEN** fetching activities fails due to a network or server error
- **THEN** the dashboard shows a non-blocking error message with a retry affordance

#### Scenario: Success state rendered

- **WHEN** the activities are fetched successfully
- **THEN** the dashboard renders each activity with an appropriate icon, message, and relative timestamp

### Requirement: Activity Data Contract

The system MUST return activity records in a stable, documented shape.

#### Scenario: Activity JSON shape

- **WHEN** `GET /activities` responds with items
- **THEN** each item includes `{ id: string, type: 'login_success'|'profile_updated'|'password_changed'|'avatar_updated', message: string, createdAt: ISO-8601 string }`
