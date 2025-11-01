## Why

Teams need to safely evolve stored procedures over time. Authors want to see what changed between edits, and operators need a fast rollback path when a publish introduces regressions. Today we keep only a single draft and the last published text, which prevents: historical diffs, auditing, and one‑click rollback.

## What Changes

- Add per‑procedure immutable version history stored in Postgres
- Record a new version on publish only (deployed snapshot); no versions for drafts, unpublish, or rollback
- Expose REST endpoints to list versions (published‑only), fetch a specific version, and rollback to a version
- Web UI: Version History dialog with explicit View/Compare modes, Monaco Diff, “Current” label, simplified item metadata (vN • creator • date), no published badge, and rollback disabled for current
- Permissions: Author/Owner can create/edit/publish/rollback; Member can view history and diffs
- Observability: activities emitted for version create (publish) and rollback action (no snapshot)

## Impact

- Affected specs: specs/sql-editor/spec.md
- Affected code:
  - Backend: apps/api/src/sql-editor (new entity + migrations; controller/service extensions)
  - Frontend: apps/web/src/features/sql-editor (new API methods, hooks, Version History dialog)
  - DB: new table stored_procedure_versions
