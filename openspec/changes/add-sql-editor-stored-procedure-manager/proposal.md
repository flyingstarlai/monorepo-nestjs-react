## Why

Enable teams to create, manage, and safely execute MSSQL stored procedures from the app using consistent, admin-defined templates, version control, and workspace-scoped permissions — without impacting existing PostgreSQL-backed features.

## What Changes

- SQL Editor module with:
  - Stored procedure explorer (file-tree by category) and editor (Monaco)
  - Admin-only category and template management (consistent parameters)
  - Procedure versioning with diff and revert
  - Safe execution harness with parameter input
- Per-workspace MSSQL integration:
  - Use the workspace Environment configuration (in environments table) as the source of truth
  - Only workspace Owner/Admin can configure environments; connections are established per workspace and cached
- Status and publish model:
  - Procedures have status: `draft` or `published`
  - Publishing applies the selected version to the workspace MSSQL database via CREATE OR ALTER, updates `published_version_id`, and sets `published_at`
  - Execution runs the published version only (drafts support syntax-check, not execution)
- Dual database usage:
  - Keep PostgreSQL for app data and SQL Editor metadata
  - Use per-workspace MSSQL connections for procedure deployment and execution
- Permissions:
  - Owner/Author: create/edit/publish/execute; Member: execute-only
  - Owner/Author can access audit entries; Members cannot
- Rollout:
  - Feature-flagged `sql-editor` for staged enablement

## Impact

- Affected specs:
  - database (dual connections; SQL Editor metadata schema; execution audit logging; per-workspace connection via environments)
  - sql-editor (new capability)
  - state-management (new stores for explorer/editor/versioning/execution)
  - observability (metrics, traces, redacted logs)
- Affected code:
  - New SqlEditorModule (NestJS), controllers/services/guards
  - Frontend routes, sidebar nav, editor/explorer components
  - Config for per-workspace MSSQL connection registry; docker-compose for local MSSQL
- New PostgreSQL entities (metadata):
  - ProcedureCategory(id, name, description, position, created_by, created_at, updated_at)
  - ProcedureTemplate(id, name, category_id, parameters_json, created_by, created_at, updated_at)
  - StoredProcedure(id, name, category_id, template_id, workspace_id, status, current_version_id, published_version_id, published_at, created_by, created_at, updated_at)
  - ProcedureVersion(id, procedure_id, version_number, sql_content, change_description, created_by, created_at)
  - ProcedureParamPreset(id, procedure_id, name, params_json, owner_id, created_at)
  - ProcedureExecutionAudit(id, procedure_id, version_id, workspace_id, actor_id, duration_ms, status, error_code, started_at, ended_at, params_redacted_json)
- Breaking changes: None (additive; feature-flag gated)

## Non-Functional Requirements

- Security: parameterized execution, RBAC, rate limiting, timeouts, cancellation, result size cap, sensitive value redaction
- Observability: metrics (count, p50/p95/p99 duration, error rate), traces (execution span), structured logs (no result payloads)
- Performance: MSSQL pool sizing per workspace, safe defaults (timeouts), pagination for listings

## Publish/Status Model

- Save creates a new ProcedureVersion and updates `current_version_id`
- Publish sets `published_version_id = selected_version`, `status = 'published'`, `published_at = now()`, and deploys to MSSQL via CREATE OR ALTER
- Revert sets `current_version_id` to a previous version; publishing that version deploys it
- Drafts cannot be executed; provide a "Validate Syntax" action using NOEXEC/PARSEONLY against the workspace connection

## Rollout

- Feature flag `sql-editor` (default off)
- Staging validation, canary to selected workspaces
- SLOs: execution success rate ≥ 99%, p95 < 1s (configurable), error rate alarms
