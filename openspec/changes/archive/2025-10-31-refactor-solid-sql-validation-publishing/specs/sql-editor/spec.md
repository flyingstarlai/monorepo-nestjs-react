## ADDED Requirements

### Requirement: SOLID SQL Validation Pipeline

The system SHALL validate SQL stored procedures using a SOLID, extensible pipeline that separates concerns and provides consistent, actionable feedback.

#### Scenario: Syntax compilation check succeeds

- WHEN a valid stored procedure draft is submitted for validation
- THEN the system compiles the procedure using a temporary name in an isolated batch
- AND no errors are returned
- AND warnings are returned for best-practice violations only

#### Scenario: Syntax compilation check fails

- WHEN an invalid stored procedure draft is submitted
- THEN the system returns errors with message, line, and near token (when available)
- AND errors are not wrapped in unrelated TRY/CATCH artifacts
- AND the error shape matches `{ message, line?: number, column?: number, near?: string, code?: string }`

#### Scenario: Best-practice warnings emitted

- WHEN the draft uses SELECT \* or lacks SET NOCOUNT ON
- THEN the system returns warnings
- AND validation result remains valid=true if there are no errors

### Requirement: Deterministic Publishing Pipeline

The system SHALL publish stored procedures in a deterministic, idempotent pipeline with a precheck and a deploy step.

#### Scenario: Publish with full header

- WHEN a draft with a full CREATE/ALTER PROCEDURE header is published
- THEN the system executes the sanitized procedure text as a single batch without dynamic TRY/CATCH wrapping
- AND the operation succeeds when SQL is valid

#### Scenario: Publish with body-only draft

- WHEN a draft containing only the procedure body is published
- THEN the system constructs `CREATE OR ALTER PROCEDURE [name] AS <body>`
- AND the operation succeeds when SQL is valid

#### Scenario: Publish precheck fails

- WHEN the precheck compilation for the draft fails
- THEN the publish operation is aborted
- AND the user receives the same error shape as validation

### Requirement: Unified Error Model

The system MUST return a unified error model for both validation and publishing operations.

#### Scenario: Error model consumed on frontend

- WHEN errors are received by the web client
- THEN Monaco markers can be created using line/near details
- AND a banner and Messages panel show human-readable messages

### Requirement: Observability For Validation And Publishing

The system SHALL emit structured logs and metrics for validation and publishing.

#### Scenario: Metrics exported

- WHEN validation or publishing occurs
- THEN duration metrics and failure counters are exported
- AND log entries include sqlPreview, workspace, procedure id/name

### Requirement: Published Procedures Read-Only With Re-Draft Pipeline

Published procedures SHALL be read-only in the editor. Editing requires creating or activating a Draft derived from the currently published text, without mutating the published procedure until republished.

#### Scenario: Editor is read-only for published procedures

- WHEN a procedure is in Published state
- THEN the SQL editor is non-editable
- AND a primary action to "Edit (create draft)" is available

#### Scenario: Re-draft pipeline seeds from published

- WHEN the user chooses to edit a published procedure
- THEN the system creates or activates a Draft version seeded from the current published text
- AND the editor becomes editable for the Draft
- AND the published version remains unchanged until a new publish succeeds

#### Scenario: Existing draft is reused

- WHEN a Draft already exists for the procedure
- THEN the system opens the existing Draft instead of creating a new one

#### Scenario: Publish requires valid draft

- WHEN in Published state without an active Draft
- THEN inline editing is not permitted
- AND publishing can only occur from a validated Draft via the publishing pipeline
