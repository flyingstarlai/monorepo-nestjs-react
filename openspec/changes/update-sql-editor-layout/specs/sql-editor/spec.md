## ADDED Requirements

### Requirement: SQL Editor Procedure Explorer Pane

The system SHALL provide a procedure explorer pane to browse and operate on stored procedures.

#### Scenario: Select a procedure

- **WHEN** a user selects a procedure in the explorer
- **THEN** the editor loads its draft content
- **AND** the selection is highlighted without layout shift

#### Scenario: Context actions

- **WHEN** opening the context menu on a procedure
- **THEN** the system offers Create, Delete, Publish (if draft), Execute (if published)
- **AND** Rename and Duplicate are not present (deferred)
- **AND** actions do not change selection unless relevant (e.g., delete)

#### Scenario: Resizable and persistent width

- **WHEN** the user resizes the explorer
- **THEN** the width is applied immediately
- **AND** the width is remembered per workspace

### Requirement: SQL Editor Bottom Results Panel

The system SHALL provide a bottom panel with tabs for Results and Messages.

#### Scenario: Show execution results

- **WHEN** a published procedure is executed successfully
- **THEN** results are displayed in the Results tab as a table with row/column counts
- **AND** the panel becomes visible if hidden

#### Scenario: Show messages and warnings

- **WHEN** validation or execution produces messages (errors/warnings/info)
- **THEN** the Messages tab lists them with timestamps and severity
- **AND** the user can clear the list

#### Scenario: Resizable height

- **WHEN** the user drags the splitter between editor and bottom panel
- **THEN** the panel height adjusts and is remembered per workspace

### Requirement: SQL Editor Bottom Status Bar

The system SHALL display a persistent status bar beneath the editor area.

#### Scenario: Validation and caret state

- **WHEN** the editor content or caret position changes
- **THEN** the status bar shows validation state (Validating…/Valid/N errors)
- **AND** shows caret position as `Ln X, Col Y`

#### Scenario: Dirty and procedure status

- **WHEN** the editor content differs from last saved draft
- **THEN** the status bar shows an unsaved indicator
- **AND** when a procedure is loaded, it shows its status (draft/published)

### Requirement: SQL Editor Focus Mode (Auto-Collapsed Sidebar)

The system SHALL auto-collapse the global app sidebar while the SQL Editor route is active and restore it on exit.

#### Scenario: Collapse on enter

- **WHEN** navigating to `/c/$slug/sql-editor`
- **THEN** the app sidebar collapses (focus mode)

#### Scenario: Restore on exit

- **WHEN** navigating away from `/c/$slug/sql-editor`
- **THEN** the sidebar restores to its prior state

### Requirement: Procedure Creation Template

The system SHALL prefill a default stored procedure template when creating a procedure, using the typed name.

#### Scenario: Prefill CREATE/ALTER template

- **WHEN** the user creates a new procedure and inputs a name N (e.g., TASK_MENU)
- **THEN** the editor pre-populates a template using that name
- **AND** for MSSQL, the template uses:

```sql
CREATE OR ALTER PROCEDURE N
AS
BEGIN
    -- TODO: Add logic
END
```

- **AND** the editor marks the draft as unsaved until saved

## MODIFIED Requirements

### Requirement: Stored Procedure Editor

The system SHALL allow creating and editing a draft procedure body with SQL syntax support in a modern, flat, full‑width layout using Monaco light theme.

#### Scenario: Edit draft with validation

- **WHEN** a user creates or edits a procedure
- **THEN** the editor provides SQL syntax highlighting and basic validation
- **AND** saving updates the draft content only (does not publish)
- **AND** the editor uses Monaco `vs-light` theme with readability‑focused options (minimap off, wordWrap on, bracket colorization)
- **AND** the layout is flat (minimal borders) and full width, with no fixed max-width container (e.g., not 'max-w-7xl')

### Requirement: Procedure Execution

The system SHALL execute only the published procedure definition for the current workspace and display results in the bottom panel.

#### Scenario: Execute published procedure

- **WHEN** a user executes a stored procedure
- **THEN** the system runs the published version against the workspace MSSQL database
- **AND** parameters are collected via a simple input form based on the procedure signature
- **AND** results are displayed in the Results tab (bottom panel) with row/column counts
- **AND** execution messages (success/errors) are listed in the Messages tab

### Requirement: Sidebar Navigation (SQL Tools)

The system SHALL add a new top-level sidebar category "SQL Tools" with a "SQL Editor" item to group current and future SQL features while collapsing the app sidebar in focus mode for this route.

#### Scenario: Sidebar group and item

- **WHEN** the feature flag `FEATURE_SQL_EDITOR` is enabled and the user is within a workspace
- **THEN** the sidebar shows a "SQL Tools" group with a "SQL Editor" entry
- **AND** the entry links to the SQL Editor route for the current workspace and highlights when active
- **AND** the menu is visible to all workspace members; actions remain role-gated inside the module
- **AND** when inside the SQL Editor route, the app sidebar is auto-collapsed (focus mode)
