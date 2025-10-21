## ADDED Requirements

### Requirement: Dashboard Recent History
The web dashboard SHALL provide a "Recent History" list of the user's most recently visited eligible routes. The history SHALL be stored client-side, scoped per authenticated user, and rendered as a card on the dashboard.

#### Scenario: Record eligible route visit
- **WHEN** the user navigates to an eligible route
- **THEN** the system SHALL store an entry containing `path`, `label`, and a `timestamp`
- **AND** if an entry with the same `path` exists, it SHALL be updated in-place with the new `timestamp` and moved to the most-recent position
- **AND** the stored list SHALL be capped at 20 entries (most recent retained)

#### Scenario: Exclude non-eligible routes
- **WHEN** the user navigates to an excluded route (e.g., `login`, `/_dashboard/dashboard`, 404/not-found)
- **THEN** the system SHALL NOT record a history entry

#### Scenario: Render recent history on dashboard
- **WHEN** the user opens the dashboard
- **THEN** the "Recent History" card SHALL display up to 5 most recent entries
- **AND** each entry SHALL show the `label` and a relative time (e.g., "5m ago")
- **AND** each entry SHALL be clickable and navigate to its `path`

#### Scenario: Clear recent history
- **WHEN** the user clicks the "Clear" action in the Recent History card
- **THEN** the system SHALL remove all stored history entries for the current user
- **AND** the card SHALL immediately render the empty state

#### Scenario: Persistence across sessions
- **GIVEN** the user has history entries recorded
- **WHEN** the user reloads the app or returns later
- **THEN** the Recent History card SHALL reflect the previously stored entries

#### Scenario: Per-user scoping
- **GIVEN** two different users sign in on the same browser
- **WHEN** each user visits routes
- **THEN** each user SHALL see only their own recent history
- **AND** the storage key MUST include the authenticated user's id to prevent cross-user leakage

#### Scenario: Empty state and graceful degradation
- **GIVEN** no entries exist or client storage is unavailable
- **WHEN** the dashboard renders
- **THEN** the Recent History card SHALL show an empty state message
- **AND** the app SHALL NOT crash if `localStorage` is disabled or throws

#### Scenario: Accessibility and keyboard navigation
- **WHEN** the card is focused via keyboard
- **THEN** entries SHALL be focusable links
- **AND** the Clear action SHALL be a focusable button with an accessible name (e.g., "Clear recent history")
