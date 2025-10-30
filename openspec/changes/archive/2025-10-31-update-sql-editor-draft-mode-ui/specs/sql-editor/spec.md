## MODIFIED Requirements

### Requirement: SQL Editor Bottom Status Bar

The system SHALL display a minimal status bar beneath the editor area with essential information only and contextual draft mode actions.

#### Scenario: Validation and caret state

- WHEN the editor content or caret position changes
- THEN the status bar shows validation state (Validating…/Valid/N errors)
- AND shows caret position as `Ln X, Col Y`
- AND no manual validation button is displayed (validation remains automatic)

#### Scenario: Draft mode actions

- WHEN a procedure is in draft status and not read-only
- THEN the status bar shows icon-based Save and Publish buttons
- AND the Save button uses a save icon and triggers the onSave callback
- AND the Publish button uses a rocket icon and triggers the onPublish callback
- AND both buttons are disabled when validation is in progress or content is invalid

#### Scenario: Published mode actions

- WHEN a procedure is in published status
- THEN the status bar shows icon-based "Move to Draft" and "Execute" buttons
- AND the "Move to Draft" button uses an edit icon and creates/activates a draft version
- AND the "Execute" button uses a play icon and opens the execute dialog
- AND both buttons are disabled when validation is in progress

#### Scenario: Read-only published editor

- WHEN a procedure is in published status
- THEN the code editor is set to read-only mode
- AND the user cannot modify the SQL content directly
- AND editing is only possible by clicking "Move to Draft" to create an editable version

#### Scenario: Dirty and procedure status

- WHEN the editor content differs from last saved draft
- THEN the status bar shows an unsaved indicator
- AND when a procedure is loaded, it shows its status (draft/published)
- AND the status display remains compact with contextual action buttons

## MODIFIED Requirements

### Requirement: SQL Editor Procedure Explorer Pane

The system SHALL provide a procedure explorer pane with consistent visual design using file code icons.

#### Scenario: Procedure icon consistency

- WHEN displaying procedures in the explorer
- THEN each procedure uses the FileCode icon regardless of status
- AND the icon provides clear visual indication of SQL code files
- AND status is shown through badges and colors rather than different icons
