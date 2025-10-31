## Why

Creating stored procedures from scratch is repetitive and error‑prone. A global, reusable template library with parameters will speed up authoring, enforce best practices, and reduce mistakes.

## What Changes

- Add a global Procedure Templates Manager (Platform Admin only) to create, edit, and delete SQL templates with parameter schemas
- Define a simple placeholder syntax using `{{name}}` (Mustache‑style, no logic/loops) with a minimal param schema (type, required, default, constraints)
- Validate templates on save: detect undeclared/unused placeholders; require a valid procedure header containing `{{procedureName}}`
- Add Admin UI route `/admin/templates` for managing templates
- Add API endpoints under `/admin/templates` to list/create/update/delete and to render a preview (string substitution only)
- Integrate into Create Procedure flow: allow picking a template, fill parameters via auto‑generated form, render into SQL editor, and validate using existing compile validation per workspace

## Impact

- Affected specs: `sql-editor/spec.md`
- Affected code: API (NestJS sql-editor module + new templates controller/entity), Web (Admin routes + SQL editor create dialog)
- Security: Management restricted to Platform Admin; application available to authenticated members via existing workspace flow
