## 1. Backend: Validation Pipeline

- [x] 1.1 Introduce interfaces
  - [x] ISqlValidator { validate(sql: string, ctx): Promise<ValidationIssue[]> }
  - [x] IErrorParser { parse(error: Error | string): ParsedError }
  - [x] IProcedureNameRewriter { rewrite(sql: string, newName: string): RewriteResult }
  - [x] IMssqlClient { query(sql: string): Promise<any>; executeBatch(sql: string[]): Promise<any[]> }
- [x] 1.2 Implement SyntaxCompileValidator (MSSQL)
  - [x] Rewrite procedure name to __tc_tmp_{uuid}
  - [x] Execute as a single batch: CREATE OR ALTER PROCEDURE [tmp] AS ...
  - [x] DROP PROCEDURE [tmp] in finally if created
  - [x] Map compiler error line/near to original SQL
- [x] 1.3 Implement BestPracticesValidator
  - [x] Warn for SELECT *
  - [x] Warn for missing SET NOCOUNT ON
  - [x] Warn for missing BEGIN/END or AS keyword
- [x] 1.4 Wire ValidationService to run pipeline and return unified result
  - [x] Remove PARSEONLY/NOEXEC and TRY/CATCH dynamic wrapper
  - [x] Standardize error shape and logging

## 2. Backend: Publishing Pipeline

- [x] 2.1 Precheck step uses SyntaxCompileValidator (no temp rewrite, or temp-only based on config)
- [x] 2.2 Deploy step
  - [x] If header present → sanitize and execute as-is
  - [x] If body only → construct minimal CREATE OR ALTER header and execute
- [x] 2.3 Verify step
  - [x] Confirm procedure exists in INFORMATION_SCHEMA.ROUTINES
  - [x] Optionally compare published text via OBJECT_DEFINITION or sys.sql_modules
- [x] 2.4 Error handling
  - [x] Parse MSSQL error → {message, line?, near?, code?}
  - [x] Add structured logging including sqlPreview

## 3. Frontend UX

- [x] 3.1 Consume unified error model
- [x] 3.2 Inline Monaco markers for errors and warnings
- [x] 3.3 Clear banner with link to Messages
- [x] 3.4 Publish button disabled when last validation is invalid
- [ ] 3.5 Optional: switch to explicit "Validate" action (debounced auto-validate off by default)

## 4. Migration

- [x] 6.1 Replace ValidationService logic with pipeline; keep DTO unchanged
- [x] 6.2 Decide endpoint policy:
  - Option A: Remove `POST :procedureId/validate` (BREAKING)
  - [x] Option B: Keep endpoint as Dry Run compile using new validator (preferred)
- [x] 6.3 Update frontend hooks to new error shape
- [ ] 6.4 Update docs and runbooks
