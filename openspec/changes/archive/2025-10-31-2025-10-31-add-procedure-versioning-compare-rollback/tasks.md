Note: Tasks are checked complete if they are already implemented.

## 1. Backend

- [x] 1.1 Create stored_procedure_versions table and entity
- [x] 1.2 On publish, create a version snapshot (source=published)
- [x] 1.3 Ensure versions are created only on publish (no draft/unpublish/rollback snapshots)
- [x] 1.4 Endpoints: list versions, get version, rollback to version
- [x] 1.5 Activities: version.created, version.rolled_back

## 2. Frontend

- [x] 2.1 Types and API client for versions/rollback
- [x] 2.2 React Query hooks for versions and rollback
- [x] 2.3 Version History dialog with View/Compare modes, published-only list, and Monaco DiffEditor
- [x] 2.4 Add "History" button in editor header/status bar
- [x] 2.5 Rollback confirmation flow (disable rollback for current version)

## 3. QA / Docs

- [x] 3.1 Manual flows: save, publish, view history, diff, rollback, execute
- [x] 3.2 Edge cases: empty diff, large diffs, permission denied
- [ ] 3.3 Update README/spec usage notes if needed
