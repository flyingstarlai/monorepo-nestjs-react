## Context

Introduce a minimal SQL Editor module to manage MSSQL stored procedures via a draft/publish workflow while maintaining PostgreSQL for application data and metadata. The module supports per‑workspace permissions and environments.

## Goals / Non-Goals

- Goals:
  - Minimal create/edit/publish/execute loop
  - Draft editing with SQL syntax validation (Monaco)
  - Execute published only, scoped to workspace
  - Workspace‑based permission system (Owner/Author write, Member execute)
  - Separate MSSQL connection pool per workspace
- Non-Goals (v1):
  - Categories and templates
  - Version history, diff, revert, optimistic concurrency
  - Parameter presets
  - Persistent execution audit tables (structured logs only)
  - Other database types beyond MSSQL for procedures
  - Direct database schema management beyond stored procedures

## Decisions

- Decision: Separate MSSQL connection pool per workspace
  - Rationale: Isolate publish/execute from PostgreSQL, allow independent sizing
  - Alternatives: Single pool with multiple DBs (adds coupling/complexity)

- Decision: No version table; single `stored_procedures` with draft/published columns
  - Rationale: Simplest model to ship; history can be added later with a migration
  - Alternatives: ProcedureVersion table (adds scope/UX/tests)

- Decision: Simple list (not tree) for explorer
  - Rationale: No categories/templates; a list is sufficient and faster to ship
  - Alternatives: Tree (requires categories and reordering features)

- Decision: Sidebar category 'SQL Tools' for navigation
  - Rationale: Groups SQL-related tools; allows future expansion without changing existing routes
  - Alternatives: Place under 'Workspace' or 'Settings' (less clear; mixed semantics)

- Decision: Use Monaco Editor for SQL
  - Rationale: Mature SQL highlighting; good editing ergonomics
  - Alternatives: CodeMirror (acceptable, but Monaco already used elsewhere)

## Risks / Trade-offs

- Risk: MSSQL connection complexity alongside PostgreSQL
  - Mitigation: Isolated pools, health checks, clear error messages

- Risk: No persisted audit/history in v1
  - Mitigation: Structured logs; can add audit table in a follow-up change

- Trade-off: Limited features vs time-to-ship
  - Benefit: Delivers core value quickly; leaves room for iterative enhancements

## Migration Plan

1. Backend minimal: entity + migration + publish/execute/validate services
2. Frontend minimal: list → editor → publish/execute
3. Manual validation on staging; feature flag toggling

Rollback: Disable SQL Editor feature flag; drop `stored_procedures` via down migration if never used in prod.

## Open Questions

- Do we need any basic metrics (counts/latency) in v1, or rely on logs only?
- Should publish require a confirmation dialog in UI (recommended)?
