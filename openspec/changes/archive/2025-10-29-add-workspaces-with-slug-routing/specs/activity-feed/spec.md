## MODIFIED Requirements

### Requirement: User Recent Activities Feed

The system SHALL provide a per-user recent activities feed scoped to the selected workspace and retrievable via an authenticated API under `/c/:slug/activities`.

#### Scenario: Fetch recent activities succeeds

- WHEN the authenticated user requests `GET /c/:slug/activities` without parameters
- THEN the system returns up to 20 most recent activities for that user in that workspace ordered by newest first

#### Scenario: Pagination with cursor

- WHEN the user requests `GET /c/:slug/activities?cursor=<cursor>&limit=10`
- THEN the system returns at most 10 activities created before the cursor and provides `nextCursor` if more exist

#### Scenario: Unauthorized access

- WHEN a request to `GET /c/:slug/activities` is made without a valid JWT
- THEN the system responds with 401 Unauthorized

#### Scenario: Forbidden for non-members

- WHEN a user who is not a member of the workspace requests `GET /c/:slug/activities`
- THEN the system responds with 403 Forbidden
