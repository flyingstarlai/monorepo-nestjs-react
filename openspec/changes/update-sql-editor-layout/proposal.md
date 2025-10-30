## Why

The current SQL Editor UI uses heavier card chrome and a dark theme that reduces usable space and creates visual noise. We want a modern, neat, clear, and flat layout that maximizes code focus and introduces a results/messages panel suitable for richer workflows.

## What Changes

- Full‑width, flat layout for the SQL Editor route; minimal borders and subdued surfaces; no container max‑width (e.g., not 'max-w-7xl')
- Monaco light theme (vs-light) with readability‑focused options
- Auto‑collapse the global app sidebar in SQL Editor (focus mode), restore when leaving
- Left Procedure Explorer (file‑explorer style) to browse/select procedures, with simple context actions (Create, Delete, Publish, Execute); Rename and Duplicate removed for now
- On Create, prefill default MSSQL template `CREATE OR ALTER PROCEDURE <Name> AS BEGIN ... END` using the typed name
- Bottom panel (tabbed) for Results and Messages; resizable with the editor, minimal schema for messages
- Persistent status bar (bottom): validation state, unsaved indicator, Ln/Col, procedure status

## Impact

- Affected specs: sql-editor
- Affected code (no implementation in this change; for planning):
  - apps/web/src/routes/\_dashboard/c.$slug.sql-editor.tsx
  - apps/web/src/features/sql-editor/components/sql-editor.tsx
  - apps/web/src/features/sql-editor/components/procedure-list.tsx
  - apps/web/src/features/sql-editor/stores/sql-editor.store.ts
  - apps/web/src/components/ui/sidebar.tsx (used via useSidebar only)
- Feature flag: remains gated by FEATURE_SQL_EDITOR
- Backwards compatibility: Functional behavior unchanged; UI/UX only. Procedure execution remains published-only.

## Acceptance Target

Option 2 selected: Base layout + bottom Results/Messages panel (tabbed), resizable; minimal messages schema.

## Notes

- No server/API changes required in this proposal.
- Persistence of panel sizes and explorer state is local (per workspace) to improve UX.
- Keyboard shortcuts for Save/Validate/Execute improve editor ergonomics and align with rich editor expectations.
