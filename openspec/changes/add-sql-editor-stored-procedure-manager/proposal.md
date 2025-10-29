## Why

Enable teams to create, manage, and safely execute MSSQL stored procedures from the app using a simple draft/publish workflow, with per‑workspace permissions and environments — without impacting existing PostgreSQL‑backed features.

## What Changes

- SQL Editor module (minimal v1):
  - List procedures by workspace and open editor
  - Draft editing with SQL syntax validation (Monaco)
  - Publish copies draft → published and deploys to workspace MSSQL
  - Execute published only with parameter input and tabular results
- Navigation:
  - New sidebar category "SQL Tools" with "SQL Editor" item (feature-flagged); visible to workspace members; future SQL tools live here
- Per‑workspace MSSQL integration:
  - Read connection from workspace Environment configuration
  - Only workspace Owner/Admin can configure environments; connections are cached per workspace
- Status model:
  - Procedures have status: `draft` or `published`
  - Publishing copies draft to published, sets `published_at`, and deploys via CREATE OR ALTER
  - Drafts support syntax‑check, not execution
- Database usage:
  - Keep PostgreSQL for app data and SQL Editor metadata
  - Minimal schema: single `stored_procedures` table with draft/published columns; no categories, templates, versions, presets, or audit tables
- Permissions:
  - Owner/Author: create/edit/publish/execute; Member: execute‑only
- Rollout:
  - Feature‑flagged `sql-editor` for staged enablement

## Impact

- Affected specs:
  - database (dual connections; minimal SQL Editor schema; per‑workspace connection via environments)
  - sql-editor (new capability)
- Affected code:
  - New SqlEditorModule (NestJS), controllers/services/guards
  - Frontend route, simple list and editor components; publish/execute flows
  - Config for per‑workspace MSSQL connection registry; docker‑compose for local MSSQL
- New PostgreSQL entities (metadata):
  - `stored_procedures` (`id`, `workspace_id`, `name`, `status`, `sql_draft`, `sql_published`, `published_at`, `created_by`, `created_at`, `updated_at`)
- Breaking changes: None (additive; feature‑flag gated)

## Non-Functional Requirements

- Security: parameterized execution, RBAC, simple timeouts; redacted logs (no result payloads)
- Observability: traces/logs around publish/execute; counters optional in v1
- Performance: pragmatic pool sizing defaults and timeouts

## Publish/Status Model

- Save updates `sql_draft` only
- Publish copies `sql_draft` → `sql_published`, sets `status='published'`, `published_at=now()`, and deploys via `CREATE OR ALTER`
- Drafts cannot be executed; provide a "Validate Syntax" action using PARSEONLY/NOEXEC against the workspace connection

## Rollout

- Feature flag `sql-editor` (default off)
- Staging validation, canary to selected workspaces
