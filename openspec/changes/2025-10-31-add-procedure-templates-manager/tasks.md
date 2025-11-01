## 1. API (Templates)

- [x] 1.1 Data model: `procedure_templates` table (id, name [unique], description, sql_template TEXT, params_schema JSONB, created_by, created_at, updated_at)
- [x] 1.2 Entity + DTOs: Create/Update/Response, Param schema typing
- [x] 1.3 Controller: `GET /admin/templates`, `POST /admin/templates`, `GET /admin/templates/:id`, `PATCH /admin/templates/:id`, `DELETE /admin/templates/:id`
- [x] 1.4 Render endpoint: `POST /admin/templates/:id/render` (body: parameters, procedureName) → returns rendered SQL (no compile)
- [x] 1.5 Guards/Permissions: Platform Admin only (reuse Admin guard pattern)
- [x] 1.6 Validation: on save, verify header contains `CREATE [OR ALTER] PROCEDURE {{procedureName}}`, check undeclared/unused placeholders, and param schema constraints
- [x] 1.7 Migration: add `procedure_templates` table
- [x] 1.8 Tests: controller + validation unit tests

## 2. Web (Admin Templates UI)

- [x] 2.1 Route: `/admin/templates` with list, create, edit
- [x] 2.2 Editor: SQL template textarea with live preview pane; parameter designer (add/remove params, type, required, defaults)
- [x] 2.3 Client validation: placeholder scan, header check, undeclared/unused params, sample preview (uses defaults, sample `procedureName`)
- [x] 2.4 Hooks: query/mutation hooks for templates CRUD + render preview
- [x] 2.5 UX: inline errors; confirm delete; disabled actions for non‑Admin
- [x] 2.6 Routing refactor: Convert to layout + index pattern for `/admin/templates`
  - [x] 2.6.1 Make `admin.templates.tsx` a layout-only route with guards + `<Outlet />`
  - [x] 2.6.2 Add `admin.templates.index.tsx` for the list page UI
  - [x] 2.6.3 Add `admin.templates.$id.index.tsx` to redirect `/admin/templates/$id` → `/admin/templates/$id/edit`; remove parent `$id` route redirect to avoid hijacking preview
  - [x] 2.6.4 Ensure child routes (`new`/`edit`/`preview`) replace the list (no scroll confusion)
  - [x] 2.6.5 Verify Create/Edit/Preview links navigate and render correctly
  - [ ] 2.6.6 Update/add tests to assert Preview does not redirect to Edit

## 3. Web (Apply Template in Create Procedure)

- [x] 3.1 Fetch templates when opening Create Procedure dialog
- [x] 3.2 Add Template select (Default template preselected); show dynamic Param form from `paramsSchema`
- [x] 3.3 Auto‑bind `procedureName` to typed name; re‑render on name change
- [x] 3.4 Insert rendered SQL into editor (editable after apply)
- [x] 3.5 Validate using existing `/c/:slug/sql-editor/validate` endpoint on change
- [x] 3.6 Implement template selection in `/c/:slug/sql-editor` route for creating procedures from templates

## 4. Validation/Policy

- [x] 4.1 Placeholder Syntax: `{{key}}`, keys `[A-Za-z0-9_]+`; no logic/loops
- [x] 4.2 Reserved key: `procedureName` (required in header); `schemaName` optional (default `dbo`) if used by a template
- [x] 4.3 Param Types: `string|number|boolean|enum|identifier`; constraints: `required`, `default`, `min|max|pattern`, `options` for enum
- [x] 4.4 Rendering Rule: identifiers are substituted as‑is (templates should include `[]` quoting if desired); other types are simple text substitution

## 5. Docs/Changelog

- [ ] 5.1 Add Admin docs snippet to README (Templates)
- [ ] 5.2 Add release notes: global templates available, Admin only management
