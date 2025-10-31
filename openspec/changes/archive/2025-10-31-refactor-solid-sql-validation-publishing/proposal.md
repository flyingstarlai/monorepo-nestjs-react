## Why

Validation for SQL stored procedures is unreliable and frequently fails with confusing MSSQL parsing errors (e.g., "Incorrect syntax near 'END'") due to dynamic SQL wrapping and batch boundary issues. Publishing shares similar fragility and couples validation concerns with deployment.

We need a SOLID, deterministic, and testable validation + publishing pipeline that:

- Clearly separates responsibilities (validation vs deployment)
- Uses safe MSSQL compilation checks without false positives
- Produces consistent error shapes (line/column, near token, message)
- Is extensible for best-practice warnings and future dialects
- Fails fast with actionable messages, and deploys idempotently

## What Changes

- Refactor backend into SOLID components:
  - ISqlValidator with pipeline (SyntaxCompileValidator, BestPracticesValidator)
  - IPublisher pipeline (Precheck → Deploy → Verify)
  - IMssqlClient abstraction (query, executeBatch) to avoid incidental wrapping
- Replace current validation approach (PARSEONLY/NOEXEC with TRY/CATCH wrapper) with a safe "Temporary Compile" technique:
  - Rewrite provided procedure name to a temporary name
  - Run exact CREATE OR ALTER PROCEDURE [temp] AS ... in isolated batch
  - Drop temporary procedure, map errors back to original content
- Simplify publishing SQL generation:
  - If draft contains a full header → execute as-is (sanitized, single batch)
  - If body only → build minimal CREATE OR ALTER header and execute
  - No TRY/CATCH wrapping of dynamic SQL in publish path
- Standardize error model across validation and publishing:
  - { message, line?: number, column?: number, near?: string, code?: string }
  - Consistent parsing and mapping for Monaco markers
- Frontend UX alignment:
  - Inline markers for errors/warnings
  - Clear banner and Messages panel linkage
  - Publish disabled until last validation state is valid
  - Optional: switch from auto-validate to explicit "Validate" with debounced pre-checks
- Observability & tests:
  - Structured logs and metrics for validate/publish duration and outcomes
  - Unit tests for name rewriting and compile checks
  - Integration tests for MSSQL happy/edge cases

## Impact

- Affected specs: sql-editor (new capability spec)
- Affected code:
  - apps/api/src/sql-editor/services/validation.service.ts
  - apps/api/src/sql-editor/services/publish.service.ts
  - apps/api/src/sql-editor/services/execution.service.ts (interfaces reuse)
  - apps/api/src/workspaces/connection-manager.service.ts (DI of IMssqlClient)
  - apps/web/src/features/sql-editor/\* (UX and error shape)
- Migration: Replace current validation with new pipeline; deprecate the existing validate endpoint or convert to a Dry Run endpoint using the new validator.
