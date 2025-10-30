## MODIFIED Requirements

### Requirement: SQL Editor Procedure Explorer Pane

The system SHALL provide a procedure explorer pane focused on navigation and essential management actions only.

#### Scenario: Simplified procedure actions

- WHEN displaying procedures in the explorer
- THEN publish and execute buttons are not displayed in the explorer
- AND only essential actions (delete) remain in the dropdown menu
- AND publish and execute actions are consolidated in the bottom status bar

#### Scenario: Context actions simplified

- WHEN opening the context menu on a procedure
- THEN the system offers only Delete action
- AND Publish and Execute actions are not present in the explorer
- AND all procedure actions are available in the bottom status bar when a procedure is selected

#### Scenario: Cleaner visual hierarchy

- WHEN browsing procedures in the explorer
- THEN the interface focuses on navigation and selection
- AND action buttons do not compete with the primary navigation purpose
- AND the explorer maintains a clean, uncluttered appearance
