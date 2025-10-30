## Why

The current SQL editor displays validate and save buttons in the bottom status bar, creating visual clutter and taking up valuable space. Published procedures also lack clear visual distinction and appropriate actions. We want to streamline the UI by removing these buttons, showing contextual icon actions based on procedure status, making published procedures read-only, and improving the explorer visual design.

## What Changes

- Remove the "Validate" and "Save" text buttons from the bottom status bar
- Add icon-based "Save" and "Publish" buttons that only appear when the procedure is in draft mode
- Add icon-based "Move to Draft" and "Execute" buttons that only appear when the procedure is published
- Make the code editor read-only when the procedure is in published status
- Update the procedure explorer to use FileCode icon for all procedures
- Maintain validation status display but remove manual validation trigger (validation remains automatic)
- Keep the status bar minimal and focused on essential information (validation state, caret position, procedure status)

## Impact

- Affected specs: sql-editor
- Affected code: 
  - apps/web/src/features/sql-editor/components/sql-editor.tsx (lines 482-522)
  - apps/web/src/features/sql-editor/components/procedure-list.tsx (explorer icons)
  - apps/web/src/features/sql-editor/stores/sql-editor.store.ts (draft activation logic)
- User experience: Cleaner, more focused editor interface with contextual actions based on procedure status
- Backwards compatibility: Functional behavior unchanged; UI/UX improvement only
