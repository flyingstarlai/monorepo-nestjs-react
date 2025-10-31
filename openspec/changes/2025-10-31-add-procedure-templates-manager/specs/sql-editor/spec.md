## ADDED Requirements

### Requirement: Procedure Templates Manager (Global)

The system SHALL provide a global templates library for stored procedure authoring, managed by Platform Admins only.

#### Scenario: Admin creates a template

- WHEN a Platform Admin submits a new template with name, SQL template text, and parameter schema
- THEN the system persists it globally and makes it available to all workspaces

#### Scenario: Admin edits a template

- WHEN a Platform Admin updates a template
- THEN changes are saved and immediately used by new creations that pick the template

#### Scenario: Admin deletes a template

- WHEN a Platform Admin deletes a template
- THEN it is removed from the catalog and no longer available to pick; existing procedures are unaffected

### Requirement: Placeholder Syntax and Parameters

The system SHALL support simple placeholders in templates using `{{key}}` with a minimal parameter schema.

#### Scenario: Placeholder format

- WHEN a template is saved
- THEN placeholders MUST be alphanumeric with underscores (`[A-Za-z0-9_]+`) inside `{{ }}`

#### Scenario: Reserved placeholder

- WHEN a template is saved
- THEN it MUST include `{{procedureName}}` in a valid header line
- AND the header MUST be one of: `CREATE PROCEDURE`, `ALTER PROCEDURE`, or `CREATE OR ALTER PROCEDURE`

#### Scenario: Parameter Schema

- WHEN parameters are defined
- THEN each parameter includes: `key`, optional `label`, `type` in `string|number|boolean|enum|identifier`, `required` (bool), optional `default`, and optional constraints (`min|max|pattern|options[]` for enum)

### Requirement: Template Validation (Save Time)

The system SHALL validate templates at save time.

#### Scenario: Undeclared/unused placeholders

- WHEN saving a template
- THEN any placeholder used in SQL must exist in the parameter schema (except `procedureName`)
- AND any parameter declared but not used SHALL trigger a warning

#### Scenario: Header validation

- WHEN saving a template
- THEN the system verifies the SQL contains a valid stored procedure header including `{{procedureName}}`

### Requirement: Apply Template in Create Procedure

The system SHALL allow users to pick a template when creating a procedure and render the final SQL before saving.

#### Scenario: Pick and render

- WHEN a user opens Create Procedure
- THEN the UI lists global templates (with a Default option)
- AND selecting a template shows a parameter form derived from the schema
- AND the UI renders SQL by replacing `{{key}}` using form values (auto-binding `procedureName` to the typed name)

#### Scenario: Edit after apply

- WHEN the template is rendered into the editor
- THEN users MAY freely edit the SQL prior to saving/publishing

#### Scenario: Validation on workspace

- WHEN the rendered SQL changes
- THEN the client MAY call the existing validation endpoint for the active workspace to compile-check the text

### Requirement: Admin Access Control

The system SHALL restrict templates management to Platform Admins.

#### Scenario: Admin-only endpoints

- WHEN non-Admin requests any `/admin/templates` endpoint
- THEN the system responds with Forbidden
