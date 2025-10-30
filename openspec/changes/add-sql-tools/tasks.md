o## 0. Validation & Deltas
- [x] 0.1 Confirm scope: draft/publish only; no categories, templates, versions, presets, or audit tables
- [x] 0.2 Update deltas: database (minimal `stored_procedures`), sql-editor (editor, publish, execute)
- [x] 0.3 Run `openspec validate add-sql-editor-stored-procedure-manager --strict` and address issues

## 1. Backend (NestJS)
- [x] 1.1 Entity (PostgreSQL): `StoredProcedure`
  - Fields: `id`, `workspace_id`, `name`, `status`, `sql_draft`, `sql_published`, `published_at`, `created_by`, `created_at`, `updated_at`
  - Constraints: unique (`workspace_id`, `name`); FKs to `workspaces`, `users`
- [x] 1.2 Migration: create/drop `stored_procedures`; indexes (workspace_id, updated_at)
- [x] 1.3 MSSQL connection registry (per workspace)
  - Read from environments; cache pools; health checks, clear error handling
- [x] 1.4 Publish service
  - Copy `sql_draft` → `sql_published`, set `status='published'`, `published_at`, deploy `CREATE OR ALTER PROCEDURE` to MSSQL
- [x] 1.5 Execution service
  - Execute published only; map params; timeouts; basic result size guard; structured logs (no result payloads)
- [x] 1.6 Draft validation
  - Syntax-only check using PARSEONLY/NOEXEC against workspace MSSQL
- [x] 1.7 Controllers/guards
  - Procedures CRUD (Owner/Author)
  - Publish endpoint (Owner/Author)
  - Execute endpoint (Owner/Author/Member per policy)
- [x] 1.8 DTOs/validation and error handling
- [x] 1.9 Feature flag integration: gate module/routes behind `FEATURE_SQL_EDITOR`

## 2. Frontend (web)
- [x] 2.1 Route and sidebar: add 'SQL Tools' category with 'SQL Editor' item behind feature flag; unauthorized routing
- [x] 2.2 Procedures list for workspace; select to open editor
- [x] 2.3 Editor (Monaco): edit draft, validate syntax, save
- [x] 2.4 Publish flow: confirm publish; surface publish result
- [x] 2.5 Execute panel: parameter form; results table
- [x] 2.6 State management: list/editor/execute; cache invalidation after writes

## 3. Integration & Configuration
- [x] 3.1 Feature flag env `FEATURE_SQL_EDITOR`
- [x] 3.2 Dev/Docker: add MSSQL (e.g., azure-sql-edge) to compose; init script for demo DB
- [x] 3.3 CI: strict type-check/build; no automated tests in v1

## 4. Security & Reliability
- [x] 4.1 Parameterization enforced server-side
- [x] 4.2 RBAC: Owner/Admin environment edits; Owner/Author publish/execute; Member execute-only
- [x] 4.3 Timeouts and pool sizing defaults; no result rows in logs


## 6. Rollout
- [x] 6.1 Enable in staging; manual validation of UX and basic behavior
- [x] 6.2 Canary to selected workspaces; monitor logs
- [x] 6.3 Enable globally; archive deltas to `openspec/specs`

## Definition of Done
- [x] Feature flag default on for prod; all tasks checked; deltas archived
- [x] No sensitive leakage in logs; basic reliability measures in place
- [x] Minimal docs: endpoints, roles, publish/execute flow
