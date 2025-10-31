## Why

Long content in the SQL Editor bottom panel (Console/Validation/Results) is hidden because the tab body does not scroll. Users cannot view messages/results beyond the visible area, especially after resizing the panel.

## What Changes

- Convert bottom panel layout to a stable two-row grid (header/tabs in auto row, content in 1fr row)
- Ensure exactly one scroll container per tab body (`overflow-auto` on the tab body area; outer panel remains `overflow-hidden`)
- Remove fragile `calc()` height usage inside the tab content and rely on grid sizing
- Keep current resizable behavior; preserve per‑workspace size persistence
- Accessibility: tab body remains keyboard-focusable; scroll works with wheel/touch/keyboard
- Update spec to require scrollability for overflowing content in any bottom tab

## Impact

- Affected specs: sql-editor
- Affected code:
  - apps/web/src/routes/_dashboard/c.$slug.sql-editor.tsx (bottom panel layout)
  - apps/web/src/features/sql-editor/components/results-panel.tsx
  - apps/web/src/features/sql-editor/components/validation-panel.tsx
  - apps/web/src/features/sql-editor/components/console-panel.tsx
- No API/database changes; UI-only

## Risks

- Nested overflow bugs if additional wrappers add overflow; mitigate by enforcing a single scroll area per tab
- Minor visual shift in spacing around the Tabs header

## Rollback

- Revert the grid layout and class changes in the files listed above

