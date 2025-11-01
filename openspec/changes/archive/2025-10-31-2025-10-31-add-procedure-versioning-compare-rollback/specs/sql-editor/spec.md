## ADDED Requirements

### Requirement: Procedure Versioning

The system SHALL persist an immutable version history for each stored procedure within a workspace to support comparison and rollback.

#### Scenario: Version created on publish

- WHEN a user publishes a stored procedure
- THEN the system creates a new version record with source="published" containing the exact SQL text that was deployed
- AND the version is assigned an incrementing integer per procedure starting at 1

#### Scenario: No versions for drafts or unpublish

- WHEN a user saves a draft or unpublishes a procedure
- THEN the system SHALL NOT create any version snapshots
- AND versions represent deployed snapshots only (created on publish)

#### Scenario: Version metadata

- WHEN a version is created
- THEN the record stores: procedureId, workspaceId, version number, source (draft|published), name, sqlText, createdBy, createdAt

### Requirement: Version Listing And Retrieval

The system SHALL provide endpoints to list versions for a procedure and retrieve a specific version.

#### Scenario: List versions

- WHEN a client requests versions for a procedure
- THEN the API returns published versions sorted by createdAt DESC including id, version, createdAt, createdBy, name

#### Scenario: Get version by number

- WHEN a client requests a specific version number
- THEN the API returns the version with its sqlText and metadata

### Requirement: Version Diff (Client)

The web client SHALL allow comparing any two versions using Monaco Diff.

#### Scenario: Compare two versions

- WHEN a user selects two versions in the Version History dialog
- THEN the UI displays a side‑by‑side diff using Monaco DiffEditor with syntax highlighting for SQL
- AND the user can toggle whitespace and word‑wrap

### Requirement: Rollback To Version

The system SHALL support rolling back a stored procedure to a selected historical version.

#### Scenario: Rollback creates new draft from version

- WHEN a user with Author or Owner role requests rollback to a version
- THEN the system sets the procedure to draft status (if published)
- AND replaces sqlDraft with the selected version's sqlText
- AND does not create a new version; a version is only created on a subsequent publish
- AND records an activity entry for auditing

#### Scenario: Optional immediate publish after rollback

- WHEN rollback is completed
- THEN the client MAY request publish; publish behavior remains unchanged and creates a new version with source="published"

### Requirement: Permissions For Versioning

The system SHALL gate versioning operations by role.

#### Scenario: Read vs write permissions

- WHEN a Member views history
- THEN they can list versions and view diffs but cannot rollback
- AND Authors/Owners can create versions (via save/publish) and perform rollback

### Requirement: Version History Dialog UX

The web client SHALL provide a modern dialog with clear modes and guardrails for viewing and comparing versions.

#### Scenario: Explicit View and Compare modes

- WHEN the dialog opens
- THEN the user can switch between View and Compare modes via a toggle
- AND View mode allows selecting a single version to preview its SQL
- AND Compare mode allows selecting exactly two versions to see a side-by-side diff

#### Scenario: Current version indication and protection

- WHEN versions are listed
- THEN the latest version is labeled as Current
- AND rollback to the Current version is disabled
- AND a confirmation dialog offers “Rollback Only” and “Rollback & Publish” with a warning that rollback updates Draft and publish deploys

#### Scenario: Simplified version list items

- WHEN versions are shown
- THEN each item displays `v{number} • {creator} • {date}`
- AND no source/badge is displayed (published-only history)

## MODIFIED Requirements

### Requirement: Deterministic Publishing Pipeline

The system SHALL publish stored procedures in a deterministic, idempotent pipeline with a precheck and a deploy step.

#### Scenario: Publish with full header

- WHEN a draft with a full CREATE/ALTER PROCEDURE header is published
- THEN the system executes the sanitized procedure text as a single batch
- AND creates a new version snapshot with source="published" containing the exact SQL deployed

#### Scenario: Publish with body‑only draft

- WHEN a draft containing only the procedure body is published
- THEN the system constructs `CREATE OR ALTER PROCEDURE [name] AS <body>` and executes it
- AND creates a new version snapshot with source="published"

#### Scenario: Publish precheck fails

- WHEN the precheck compilation for the draft fails
- THEN the publish operation is aborted and returns the same error model as validation
- AND no version snapshot is created
