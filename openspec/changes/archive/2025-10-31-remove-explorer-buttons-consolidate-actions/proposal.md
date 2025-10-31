## Why

The current SQL editor has redundant action buttons - both in the file explorer (quick action buttons and dropdown menu) and in the bottom status bar. This creates visual clutter and inconsistent user experience. We want to consolidate all procedure actions into the bottom status bar for a cleaner, more focused interface.

## What Changes

- Remove publish and execute buttons from file explorer (both quick action buttons and dropdown menu items)
- Move execute functionality to be only available in bottom status bar for published procedures
- Keep only essential file explorer actions (delete) in the dropdown menu
- Maintain current bottom status bar structure with consolidated actions

## Impact

- Affected specs: sql-editor
- Affected code:
  - apps/web/src/features/sql-editor/components/procedure-list.tsx (remove publish/execute buttons)
  - apps/web/src/features/sql-editor/components/sql-editor.tsx (execute button already in bottom)
- User experience: Cleaner file explorer focused on navigation, consolidated actions in status bar
- Backwards compatibility: Functional behavior unchanged; UI/UX improvement only
