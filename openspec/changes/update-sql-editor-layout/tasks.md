## 1. Layout & Theme

- [x] 1.1 Switch Monaco theme to `vs-light`; keep readability options (minimap off, wordWrap on, bracket colorization, fontSize 14)
- [x] 1.2 Convert SQL Editor page to flat, full‑width layout; remove heavy Card chrome around the editor; remove any container max-width (e.g., no 'max-w-7xl')
- [x] 1.3 Split page into two panes: Procedure Explorer (left ~280px fixed) and Editor (right flex) with a resizable splitter
- [x] 1.4 Add bottom panel (tabbed): Results | Messages; resizable height vs editor; default closed states defined

## 2. Sidebar Focus Mode

- [x] 2.1 On route enter (`/c/$slug/sql-editor`), collapse app sidebar via `useSidebar().setOpen(false)`; cache prior state
- [x] 2.2 On route exit, restore cached sidebar state
- [x] 2.3 Do not persist focus-mode collapse to cookie/local persistence

## 3. Procedure Explorer

- [x] 3.1 Adapt existing procedure list to explorer style (flat rows, subtle hover, selected highlight)
- [x] 3.2 Provide actions: Create, Delete, Publish (draft), Execute (published) — defer Rename and Duplicate
- [x] 3.3 Selection loads draft into editor without modal/context disruption
- [x] 3.4 Optional: remember explorer width per workspace (localStorage)
- [x] 3.5 On Create, prefill editor with default MSSQL template `CREATE OR ALTER PROCEDURE <Name> AS BEGIN ... END` using the typed name; mark draft dirty

## 4. Results & Messages Panel

- [x] 4.1 Results tab: render tabular results for procedure execution, with row/col counts and basic paging/virtualization if needed
- [x] 4.2 Messages tab: show validation errors, execution messages, and warnings (minimal schema)
- [x] 4.3 Add clear button; optionally auto‑scroll on updates
- [x] 4.4 Wire to existing execute/validate flows; no API changes

## 5. Status Bar

- [x] 5.1 Show validation state (Validating… / Valid / N errors)
- [x] 5.2 Show unsaved indicator when editor content differs from last save
- [x] 5.3 Show procedure status chip (draft/published)
- [x] 5.4 Show caret position: `Ln X, Col Y`

## 6. Keyboard & Guards

- [x] 6.1 Shortcuts: Save (Cmd/Ctrl+S), Validate (Cmd/Ctrl+Enter), Execute (Shift+Enter)
- [x] 6.2 Route change guard: confirm navigation if editor is dirty

## 7. Persistence

- [x] 7.1 Persist panel sizes (left explorer width, bottom panel height) and explorer collapsed/open state per workspace
- [x] 7.2 Persist last open procedure per workspace

## 8. Responsive, A11y, QA

- [x] 8.1 Responsive: collapse explorer under 1024px behind a toggle
- [x] 8.2 A11y: focus outlines, ARIA for menus/tabs
- [x] 8.3 Visual QA: flat spacing scale and tokens; contrast on light theme

## 9. Definition of Done

- [x] 9.1 Sidebar collapses on enter and restores on exit
- [x] 9.2 Explorer + Editor + Bottom panel layout present and resizable
- [x] 9.3 Status bar shows validation, dirty, status, Ln/Col
- [x] 9.4 Results flow renders to bottom panel; Messages tab shows errors/warnings
- [x] 9.5 No API changes; behind `FEATURE_SQL_EDITOR`
- [x] 9.6 Explorer actions exclude Rename and Duplicate
- [x] 9.7 Creating a procedure pre-fills a default template with the typed name
- [x] 9.8 When creating a procedure, set it as the active/selected procedure in the editor
