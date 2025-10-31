# SQL Editor

## Purpose

Define requirements for creating, validating, publishing, and executing MSSQL stored procedures with a draft/publish workflow, modern editor UI, and per‑workspace environments.
## Requirements
### Requirement: SQL Editor Module

The system SHALL provide a minimal SQL Editor to manage MSSQL stored procedures with a draft/publish workflow.

#### Scenario: Access and listing

- WHEN an authenticated user navigates to SQL Editor within a workspace
- THEN the system lists stored procedures for that workspace
- AND actions are gated by role: Owner/Author can create/edit/publish/execute, Member can execute‑only

### Requirement: Stored Procedure Editor

The system SHALL allow creating and editing a draft procedure body with SQL syntax support in a modern, flat, full‑width layout using Monaco light theme.

#### Scenario: Edit draft with validation

- WHEN a user creates or edits a procedure
- THEN the editor provides SQL syntax highlighting and validation
- AND saving updates the draft content only (does not publish)
- AND the editor uses Monaco `vs-light` theme with readability‑focused options (minimap off, wordWrap on, bracket colorization)
- AND the layout is flat (minimal borders) and full width

### Requirement: Draft and Publish Model

The system SHALL separate draft editing from published execution.

#### Scenario: Publish copies draft to published

- WHEN a user with Owner or Author role publishes a procedure
- THEN the system copies the current draft body to the published body
- AND sets `status='published'` and updates `published_at`
- AND deploys a `CREATE OR ALTER PROCEDURE` statement to the workspace MSSQL database

#### Scenario: Drafts cannot execute

- WHEN a procedure is in draft
- THEN it cannot be executed
- AND users may run validation against the workspace MSSQL connection

### Requirement: SOLID SQL Validation Pipeline

The system SHALL validate SQL stored procedures using a SOLID, extensible pipeline that separates concerns and provides consistent, actionable feedback.

#### Scenario: Syntax compilation check succeeds

- WHEN a valid stored procedure draft is submitted for validation
- THEN the system compiles the procedure using a temporary name in an isolated batch
- AND no errors are returned
- AND warnings are returned for best‑practice violations only

#### Scenario: Syntax compilation check fails

- WHEN an invalid stored procedure draft is submitted
- THEN the system returns errors with message, line, and near token (when available)
- AND the error shape matches `{ message, line?: number, column?: number, near?: string, code?: string }`

#### Scenario: Best‑practice warnings emitted

- WHEN the draft uses SELECT \* or lacks SET NOCOUNT ON
- THEN the system returns warnings and the result remains valid=true if there are no errors

### Requirement: Deterministic Publishing Pipeline

The system SHALL publish stored procedures in a deterministic, idempotent pipeline with a precheck and a deploy step.

#### Scenario: Publish with full header

- WHEN a draft with a full CREATE/ALTER PROCEDURE header is published
- THEN the system executes the sanitized procedure text as a single batch

#### Scenario: Publish with body‑only draft

- WHEN a draft containing only the procedure body is published
- THEN the system constructs `CREATE OR ALTER PROCEDURE [name] AS <body>` and executes it

#### Scenario: Publish precheck fails

- WHEN the precheck compilation for the draft fails
- THEN the publish operation is aborted and returns the same error model as validation

### Requirement: Unified Error Model

The system MUST return a unified error model for both validation and publishing operations and surface it in the UI.

#### Scenario: Error model consumed on frontend

- WHEN errors are received by the web client
- THEN Monaco markers can be created using line/near details
- AND a banner and Messages panel show human‑readable messages

### Requirement: Observability For Validation And Publishing

The system SHALL emit structured logs and metrics for validation and publishing.

#### Scenario: Metrics exported

- WHEN validation or publishing occurs
- THEN duration metrics and failure counters are exported
- AND log entries include a minimal sqlPreview, workspace, procedure id/name

### Requirement: Published Procedures Read‑Only With Re‑Draft Pipeline

Published procedures SHALL be read‑only in the editor. Editing requires creating or activating a Draft derived from the currently published text, without mutating the published procedure until republished.

#### Scenario: Editor is read‑only for published procedures

- WHEN a procedure is in Published state
- THEN the SQL editor is non‑editable
- AND a primary action "Move to Draft" is available

#### Scenario: Re‑draft pipeline seeds from published

- WHEN the user chooses to edit a published procedure
- THEN the system creates or activates a Draft version seeded from the current published text
- AND the editor becomes editable for the Draft
- AND the published version remains unchanged until a new publish succeeds

### Requirement: Procedure Explorer Pane

The system SHALL provide a procedure explorer pane to browse and operate on stored procedures, focused on navigation with a clean visual hierarchy.

#### Scenario: Select a procedure

- WHEN a user selects a procedure in the explorer
- THEN the editor loads its draft content and the selection is highlighted

#### Scenario: Context actions simplified

- WHEN opening the context menu on a procedure
- THEN only essential actions are offered (e.g., Delete)
- AND Publish/Execute are not shown in the explorer; actions are consolidated in the status bar

#### Scenario: Procedure icon consistency

- WHEN displaying procedures in the explorer
- THEN each procedure uses the FileCode icon regardless of status
- AND status is shown via badges/colors rather than different icons

#### Scenario: Resizable and persistent width

- WHEN the user resizes the explorer
- THEN the width is applied immediately and remembered per workspace

### Requirement: Bottom Results and Messages Panel

The system SHALL provide a bottom panel with tabs for Results and Messages, resizable with the editor.

#### Scenario: Show execution results

- WHEN a published procedure is executed successfully
- THEN results are displayed in the Results tab with row/column counts and the panel becomes visible if hidden

#### Scenario: Show messages and warnings

- WHEN validation or execution produces messages (errors/warnings/info)
- THEN the Messages tab lists them with timestamps and severity and the list can be cleared

#### Scenario: Resizable height persistence

- WHEN the splitter is dragged
- THEN the panel height adjusts and is remembered per workspace

#### Scenario: Scrollable tab content

- WHEN content in any bottom panel tab (Results or Messages) exceeds the visible panel height
- THEN the tab body SHALL be vertically scrollable within the bottom panel
- AND the page outside the SQL Editor SHALL NOT scroll as a result of the overflow
- AND there SHALL be exactly one primary scroll container per tab body to avoid nested scroll conflicts
- AND scrolling SHALL work with mouse wheel/trackpad and via keyboard when the tab body is focused
- AND resizing the bottom panel SHALL preserve scrollability without clipping content

### Requirement: Bottom Status Bar (Draft vs Published)

The system SHALL display a minimal status bar beneath the editor with essential information and contextual actions based on procedure status.

#### Scenario: Validation and caret state

- WHEN the editor content or caret position changes
- THEN the status bar shows validation state (Validating…/Valid/N errors) and `Ln X, Col Y`

#### Scenario: Draft mode actions

- WHEN a procedure is in draft status and not read‑only
- THEN the status bar shows icon‑based Save and Publish buttons

#### Scenario: Published mode actions

- WHEN a procedure is in published status
- THEN the status bar shows icon‑based "Move to Draft" and "Execute" buttons
- AND the editor itself is read‑only

### Requirement: Focus Mode (Auto‑Collapsed Sidebar)

The system SHALL auto‑collapse the global app sidebar while the SQL Editor route is active and restore it on exit.

#### Scenario: Collapse on enter / restore on exit

- WHEN navigating to `/c/$slug/sql-editor`
- THEN the app sidebar collapses and restores when leaving the route

### Requirement: Procedure Execution

The system SHALL execute only the published procedure definition for the current workspace and display results in the bottom panel.

#### Scenario: Execute published procedure

- WHEN a user executes a stored procedure
- THEN the system runs the published version against the workspace MSSQL database
- AND parameters are collected via a simple input form based on the procedure signature
- AND results are displayed in the Results tab with row/column counts; execution messages are listed in Messages

### Requirement: Sidebar Navigation (SQL Tools)

The system SHALL add a top‑level sidebar category "SQL Tools" with a "SQL Editor" item to group current and future SQL features.

#### Scenario: Sidebar group and item

- WHEN `FEATURE_SQL_EDITOR` is enabled and the user is within a workspace
- THEN the sidebar shows a "SQL Tools" group with a "SQL Editor" entry
- AND the entry links to the SQL Editor route and highlights when active; visibility to all members; actions remain role‑gated in the module

