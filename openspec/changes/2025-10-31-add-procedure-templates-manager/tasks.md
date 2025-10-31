## 1. API (Templates)

- [ ] 1.1 Data model: `procedure_templates` table (id, name [unique], description, sql_template TEXT, params_schema JSONB, created_by, created_at, updated_at)
- [ ] 1.2 Entity + DTOs: Create/Update/Response, Param schema typing
- [ ] 1.3 Controller: `GET /admin/templates`, `POST /admin/templates`, `GET /admin/templates/:id`, `PATCH /admin/templates/:id`, `DELETE /admin/templates/:id`
- [ ] 1.4 Render endpoint: `POST /admin/templates/:id/render` (body: parameters, procedureName) → returns rendered SQL (no compile)
- [ ] 1.5 Guards/Permissions: Platform Admin only (reuse Admin guard pattern)
- [ ] 1.6 Validation: on save, verify header contains `CREATE [OR ALTER] PROCEDURE {{procedureName}}`, check undeclared/unused placeholders, and param schema constraints
- [ ] 1.7 Migration: add `procedure_templates` table
- [ ] 1.8 Tests: controller + validation unit tests

## 2. Web (Admin Templates UI)

- [ ] 2.1 Route: `/admin/templates` with list, create, edit
- [ ] 2.2 Editor: SQL template textarea with live preview pane; parameter designer (add/remove params, type, required, defaults)
- [ ] 2.3 Client validation: placeholder scan, header check, undeclared/unused params, sample preview (uses defaults, sample `procedureName`)
- [ ] 2.4 Hooks: query/mutation hooks for templates CRUD + render preview
- [ ] 2.5 UX: inline errors; confirm delete; disabled actions for non‑Admin

## 3. Web (Apply Template in Create Procedure)

- [ ] 3.1 Fetch templates when opening Create Procedure dialog
- [ ] 3.2 Add Template select (Default template preselected); show dynamic Param form from `paramsSchema`
- [ ] 3.3 Auto‑bind `procedureName` to typed name; re‑render on name change
- [ ] 3.4 Insert rendered SQL into editor (editable after apply)
- [ ] 3.5 Validate using existing `/c/:slug/sql-editor/validate` endpoint on change

## 4. Validation/Policy

- [ ] 4.1 Placeholder Syntax: `{{key}}`, keys `[A-Za-z0-9_]+`; no logic/loops
- [ ] 4.2 Reserved key: `procedureName` (required in header); `schemaName` optional (default `dbo`) if used by a template
- [ ] 4.3 Param Types: `string|number|boolean|enum|identifier`; constraints: `required`, `default`, `min|max|pattern`, `options` for enum
- [ ] 4.4 Rendering Rule: identifiers are substituted as‑is (templates should include `[]` quoting if desired); other types are simple text substitution

## 5. Docs/Changelog

- [ ] 5.1 Add Admin docs snippet to README (Templates)
- [ ] 5.2 Add release notes: global templates available, Admin only management
