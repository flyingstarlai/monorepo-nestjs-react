## ADDED Requirements

### Requirement: SQL Editor Module

The system SHALL provide a comprehensive SQL Editor module for managing MSSQL stored procedures with template-based creation and version control.

#### Scenario: SQL Editor access

- **WHEN** authenticated user navigates to SQL Editor
- **THEN** system displays SQL Explorer interface with stored procedures
- **AND** interface shows file tree structure organized by category
- **AND** user permissions are enforced based on workspace role

#### Scenario: Permission-based access control

- **WHEN** user with Owner or Author role accesses SQL Editor
- **THEN** user can create, edit, and execute stored procedures
- **AND** user can view procedure history and versions
- **WHEN** user with Member role accesses SQL Editor
- **THEN** user can only execute stored procedures for testing
- **AND** user cannot create or modify procedures

### Requirement: Procedure Category Management

The system SHALL support admin-only management of procedure categories for organizing stored procedures.

#### Scenario: Category creation by admin

- **WHEN** admin creates a new procedure category
- **THEN** category is saved with unique name and description
- **AND** category is available for template assignment
- **AND** category appears in SQL Explorer tree structure

#### Scenario: Category organization

- **WHEN** procedures are created
- **THEN** they are organized under their assigned category
- **AND** categories provide hierarchical structure in explorer
- **AND** categories can be reordered by admin users

### Requirement: Procedure Template System

The system SHALL provide admin-only template management for ensuring consistent parameter structures across procedures in the same category.

#### Scenario: Template creation

- **WHEN** admin creates a procedure template
- **THEN** template includes parameter definitions with types and descriptions
- **AND** template is assigned to a specific category
- **AND** template defines the standard structure for procedures in that category

#### Scenario: Template-based procedure creation

- **WHEN** user creates new stored procedure
- **THEN** system presents templates based on selected category
- **AND** selected template pre-populates parameter structure
- **AND** user cannot modify template-defined parameters
- **AND** procedure maintains consistency with category standards

### Requirement: Stored Procedure Explorer

The system SHALL provide a file tree-like interface for browsing and managing stored procedures.

#### Scenario: File tree navigation

- **WHEN** user opens SQL Explorer
- **THEN** procedures are displayed in hierarchical tree structure
- **AND** categories appear as folders with procedure files inside
- **AND** tree supports expand/collapse functionality
- **AND** tree shows procedure status indicators (draft, published, etc.)

#### Scenario: Procedure selection and preview

- **WHEN** user clicks on procedure in explorer
- **THEN** system shows procedure preview with metadata
- **AND** preview displays category, template, last modified, and version
- **AND** user can open procedure for editing or execution

### Requirement: Stored Procedure Editor

The system SHALL provide a feature-rich SQL editor for creating and modifying stored procedures.

#### Scenario: Procedure creation with template

- **WHEN** user creates new procedure
- **THEN** editor opens with template-based parameter structure
- **AND** editor provides SQL syntax highlighting and auto-completion
- **AND** editor validates SQL syntax before saving
- **AND** user can test procedure execution before saving

#### Scenario: Procedure editing

- **WHEN** user edits existing procedure
- **THEN** editor loads current procedure content with full history
- **AND** editor shows comparison with previous version
- **AND** changes create new version automatically
- **AND** editor prevents modification of template-defined parameters

### Requirement: Procedure Version Control

The system SHALL maintain version history for stored procedures with diff and publish semantics.

#### Scenario: Automatic versioning on save

- **WHEN** a user saves changes to a procedure
- **THEN** the system creates a new ProcedureVersion with monotonically increasing version_number
- **AND** the new version records timestamp, author, and optional change description
- **AND** StoredProcedure.current_version_id is updated to the new version

#### Scenario: Optimistic concurrency guard

- **WHEN** a save request includes a base_version_id that does not match current_version_id
- **THEN** the system rejects the save with a 409 Conflict indicating the draft is out of date

#### Scenario: Revert current version

- **WHEN** a user selects a previous version to use as current
- **THEN** the system sets current_version_id to the selected version
- **AND** the published version remains unchanged until publish is requested

#### Scenario: Publish selected version

- **WHEN** a user with Owner or Author role publishes a selected version
- **THEN** the system compiles a CREATE OR ALTER PROCEDURE statement using the template-defined parameter signature and the selected version's sql_body
- **AND** applies it to the workspace's MSSQL connection
- **AND** updates published_version_id, status to 'published', and published_at
- **AND** on error, no published metadata is changed and the error is returned

#### Scenario: Version comparison and diff

- **WHEN** user views procedure history
- **THEN** system shows list of all versions with metadata
- **AND** user can compare any two versions
- **AND** diff viewer highlights changes in SQL code
- **AND** user can revert to previous version if needed

### Requirement: Procedure Execution and Testing

The system SHALL provide a safe execution environment for testing stored procedures.

#### Scenario: Procedure execution (published-only)

- **WHEN** user executes a stored procedure
- **THEN** system runs the published version against the workspace's MSSQL database
- **AND** execution uses the appropriate workspace database context
- **AND** results are displayed in tabular format
- **AND** only the published version executes; drafts cannot be executed
- **AND** execution is logged for audit purposes

#### Scenario: Parameter input for execution

- **WHEN** user executes procedure with parameters
- **THEN** system presents input form based on procedure signature
- **AND** form validates parameter types before execution
- **AND** only Owner/Author can save parameter sets for repeated testing; Members may use inputs but cannot save presets

#### Scenario: Draft syntax validation

- **WHEN** a user validates a draft version or current editor content
- **THEN** the system performs a syntax-only check (e.g., PARSEONLY/NOEXEC) against the workspace MSSQL connection
- **AND** returns errors or warnings without persisting or executing the procedure
- **AND** validation is available even when no version has been published

### Requirement: MSSQL Connection Management

The system SHALL manage MSSQL connections separate from PostgreSQL application database.

#### Scenario: Dual database support

- **WHEN** application starts
- **THEN** PostgreSQL connection is established for application data
- **AND** MSSQL connection pool is established for procedure execution
- **AND** connections are properly isolated and managed separately

#### Scenario: Connection configuration

- **WHEN** MSSQL connection is configured
- **THEN** connection uses workspace Environment configuration from the environments table (environment variables may provide global defaults)
- **AND** connection pooling is optimized for performance
- **AND** connection health is monitored and reported

### Requirement: Workspace Integration

The system SHALL integrate stored procedures with workspace context and permissions.

#### Scenario: Workspace-scoped procedures

- **WHEN** procedures are created
- **THEN** they are associated with specific workspace
- **AND** only workspace members can access procedures
- **AND** workspace context is applied during execution

#### Scenario: Permission inheritance

- **WHEN** user accesses procedures
- **THEN** workspace role determines available actions
- **AND** Owner and Author roles have full access
- **AND** Member role has execute-only access
- **AND** permissions are enforced on both frontend and backend