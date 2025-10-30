## ADDED Requirements

### Requirement: SQL Editor Module

The system SHALL provide a minimal SQL Editor to manage MSSQL stored procedures with a draft/publish workflow.

#### Scenario: Access and listing

- WHEN an authenticated user navigates to SQL Editor within a workspace
- THEN the system lists stored procedures for that workspace
- AND actions are gated by role: Owner/Author can create/edit/publish/execute, Member can execute-only

### Requirement: Stored Procedure Editor

The system SHALL allow creating and editing a draft procedure body with SQL syntax support.

#### Scenario: Edit draft with validation

- WHEN a user creates or edits a procedure
- THEN the editor provides SQL syntax highlighting and basic validation
- AND saving updates the draft content only (does not publish)

### Requirement: Draft and Publish Model

The system SHALL separate draft editing from published execution.

#### Scenario: Publish copies draft to published

- WHEN a user with Owner or Author role publishes a procedure
- THEN the system copies the current draft body to the published body
- AND sets `status = 'published'` and updates `published_at`
- AND deploys a `CREATE OR ALTER PROCEDURE` statement to the workspace MSSQL database using the published body

#### Scenario: Drafts cannot execute

- WHEN a procedure is in draft
- THEN it cannot be executed
- AND users may run syntax-only validation against the workspace MSSQL connection

### Requirement: Procedure Execution

The system SHALL execute only the published procedure definition for the current workspace and display results.

#### Scenario: Execute published procedure

- WHEN a user executes a stored procedure
- THEN the system runs the published version against the workspace MSSQL database
- AND parameters are collected via a simple input form based on the procedure signature
- AND results are displayed in a tabular view
- AND the system records structured logs but does not persist an audit row

### Requirement: Workspace Integration

The system SHALL scope procedures and permissions to the current workspace.

#### Scenario: Workspace scoping and roles

- WHEN accessing procedures
- THEN only members of the workspace can view/execute them
- AND Owner/Author roles may create/edit/publish/execute
- AND Member role may execute-only

### Requirement: Sidebar Navigation (SQL Tools)

The system SHALL add a new top-level sidebar category "SQL Tools" with a "SQL Editor" item to group current and future SQL features.

#### Scenario: Sidebar group and item

- WHEN the feature flag `FEATURE_SQL_EDITOR` is enabled and the user is within a workspace
- THEN the sidebar shows a "SQL Tools" group with a "SQL Editor" entry
- AND the entry links to the SQL Editor route for the current workspace and highlights when active
- AND the menu is visible to all workspace members; actions remain role-gated inside the module
