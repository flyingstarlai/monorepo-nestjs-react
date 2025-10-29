## 0. Validation & Deltas
- [ ] 0.1 Confirm scope and resolved answers (per-workspace MSSQL via environments; Owner/Admin configure; Owner/Author audit access; draft/published model; presets Owner/Author only)
- [ ] 0.2 Update deltas as needed: database (status/position/current_version_id/published_version_id/audit/presets), sql-editor (publish/execute semantics), state-management (stores), observability (metrics/logging)
- [ ] 0.3 Run `openspec validate add-sql-editor-stored-procedure-manager --strict` and address issues

## 1. Backend (NestJS)
- [ ] 1.1 Entities (PostgreSQL):
  - [ ] 1.1.1 ProcedureCategory(+position)
  - [ ] 1.1.2 ProcedureTemplate
  - [ ] 1.1.3 StoredProcedure(+status,+current_version_id,+published_version_id,+published_at)
  - [ ] 1.1.4 ProcedureVersion
  - [ ] 1.1.5 ProcedureParamPreset (Owner/Author only)
  - [ ] 1.1.6 ProcedureExecutionAudit (metadata only; redacted params)
- [ ] 1.2 Migrations: create tables, FKs, uniques, indexes; rollback verified
- [ ] 1.3 MSSQL connection registry (per workspace):
  - [ ] 1.3.1 Read from environments table; Owner/Admin are sole configurators
  - [ ] 1.3.2 Create cached connection pools per workspace; health checks; backoff
  - [ ] 1.3.3 Handle missing/misconfigured environments with clear errors
- [ ] 1.4 Publish service:
  - [ ] 1.4.1 Compile selected ProcedureVersion into CREATE OR ALTER [schema].[name]
  - [ ] 1.4.2 Apply to the workspace MSSQL connection
  - [ ] 1.4.3 Update `published_version_id`, `status='published'`, `published_at`
- [ ] 1.5 Execution service:
  - [ ] 1.5.1 Execute published version only (map params to types)
  - [ ] 1.5.2 Timeouts, cancellation, result size cap, rate limiting
  - [ ] 1.5.3 Audit record on start/end (duration, status, error_code, redacted params)
- [ ] 1.6 Draft validation:
  - [ ] 1.6.1 Syntax check using NOEXEC/PARSEONLY against workspace connection
  - [ ] 1.6.2 No draft execution
- [ ] 1.7 Versioning service: auto-increment, set `current_version_id`, revert support
- [ ] 1.8 Controllers/guards:
  - [ ] 1.8.1 Categories (admin-only; reorder by position)
  - [ ] 1.8.2 Templates (admin-only)
  - [ ] 1.8.3 Procedures (Owner/Author CRUD)
  - [ ] 1.8.4 Versions (list/history/diff)
  - [ ] 1.8.5 Publish endpoint (Owner/Author)
  - [ ] 1.8.6 Execute endpoint (Owner/Author/Member per policy)
  - [ ] 1.8.7 Audit query endpoint (Owner/Author only)
  - [ ] 1.8.8 Param presets endpoints (Owner/Author)
- [ ] 1.9 DTOs/validation pipes and comprehensive error handling
- [ ] 1.10 Observability: metrics (counts, latency, errors), traces around MSSQL calls, structured logs (no result rows)
- [ ] 1.11 Feature flag integration: gate module/routes behind `FEATURE_SQL_EDITOR`
- [ ] 1.12 Seeders: sample category/template; fixtures for e2e

## 2. Frontend (web)
- [ ] 2.1 Routes and sidebar entry behind feature flag; unauthorized routing
- [ ] 2.2 Explorer (tree): categories (sortable), procedures, indicators (status, published version)
- [ ] 2.3 Admin UIs: category CRUD with reorder; template CRUD with param schema builder
- [ ] 2.4 Editor (Monaco): edit body; lock template-defined params; syntax validator
- [ ] 2.5 Versions: list, diff (Monaco diff), revert flow with confirmation
- [ ] 2.6 Publish flow: select version, confirm publish, surface publish result
- [ ] 2.7 Execute panel: run published version; param form from signature; results with pagination; presets (Owner/Author only)
- [ ] 2.8 Audit viewer: filter by date/user/status; Owner/Author only
- [ ] 2.9 State management: stores for explorer, editor, versions, execution, audit; cache invalidation after writes
- [ ] 2.10 Permissions UX: disable/hide actions by role; consistent toasts/errors
- [ ] 2.11 Loading/skeletons and safe optimistic updates

## 3. Integration & Configuration
- [ ] 3.1 Feature flag env `FEATURE_SQL_EDITOR`
- [ ] 3.2 Dev/Docker: add MSSQL (e.g., azure-sql-edge) to compose; init script for demo DB
- [ ] 3.3 CI: MSSQL service for API tests; secrets handling; strict type-check/build

## 4. Security & Reliability
- [ ] 4.1 Parameterization enforced server-side; reject non-conforming SQL
- [ ] 4.2 RBAC: Owner/Admin environment edits; Owner/Author publish/execute; Member execute-only
- [ ] 4.3 Timeouts, rate and concurrency limits; connection pool sizing per workspace
- [ ] 4.4 Redaction policy: never log result rows; params redacted in audit
- [ ] 4.5 Access logs & audit visibility restricted to Owner/Author

## 5. Testing
- [ ] 5.1 Unit: versioning, publish, execute, connection registry, RBAC, validators
- [ ] 5.2 Integration: controllers (CRUD, publish, execute), migrations up/down
- [ ] 5.3 E2E: explorer→edit→version→publish→execute workflows; audit visibility; role enforcement; revert
- [ ] 5.4 Perf: execution latency, result-size limits; pool saturation behavior
- [ ] 5.5 Security: injection attempts, privilege escalation prevention

## 6. Documentation
- [ ] 6.1 API docs (endpoints, roles, error codes)
- [ ] 6.2 User guide (editor, versions, publish, execute, presets, roles)
- [ ] 6.3 Runbook: MSSQL connectivity, timeouts, rate limits, rollbacks; per-workspace env troubleshooting
- [ ] 6.4 Grafana dashboards/alerts for counts, latency, errors

## 7. Rollout
- [ ] 7.1 Enable in staging; validate SLOs/UX; fix blockers
- [ ] 7.2 Canary to selected workspaces; monitor metrics/logs
- [ ] 7.3 Enable globally; archive deltas to `openspec/specs`

## Definition of Done
- [ ] Feature flag default on for prod, all tasks checked, deltas archived
- [ ] Observability confirms SLOs; audit present; no sensitive leakage
- [ ] Docs and runbook published; handoff complete
