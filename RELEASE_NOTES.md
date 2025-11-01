# Release Notes

## [Version X.X.X] - 2025-10-31

### 🆕 New Features

#### Procedure Templates Manager
- **Global Template Library**: Platform Admins can now create, edit, and manage reusable SQL procedure templates
- **Template Parameters**: Support for dynamic parameter substitution with `{{placeholder}}` syntax
- **Parameter Types**: String, number, boolean, enum, and identifier types with validation
- **Template Validation**: Automatic validation of template syntax, required placeholders, and parameter constraints
- **Live Preview**: Real-time template rendering with sample values during template creation
- **Integration with Create Procedure**: Users can select templates when creating new procedures with dynamic parameter forms

#### Template Features
- **Mustache-style Syntax**: Simple `{{parameterName}}` placeholder syntax without complex logic
- **Required procedureName**: Templates must include `{{procedureName}}` in CREATE PROCEDURE header
- **Parameter Constraints**: Support for min/max values, regex patterns, and enum options
- **Admin-only Management**: Template creation and management restricted to Platform Admins
- **Template Rendering**: API endpoint for rendering templates with provided parameters

### 🛠️ Technical Implementation

#### Backend Changes
- **New Entity**: `ProcedureTemplate` with JSONB parameter schema
- **API Endpoints**: Full CRUD operations under `/admin/templates`
- **Render Endpoint**: `POST /admin/templates/:id/render` for template preview
- **Validation Service**: Comprehensive template validation logic
- **Migration**: New `procedure_templates` table with proper constraints

#### Frontend Changes
- **Admin UI**: Complete template management interface at `/admin/templates`
- **Template Editor**: SQL editor with live preview and parameter designer
- **Enhanced Create Dialog**: Template selection with dynamic parameter forms
- **Query Hooks**: TanStack Query integration for template operations
- **Type Safety**: Full TypeScript support for template schemas

### 🔒 Security & Permissions
- **Platform Admin Only**: Template management restricted to users with Admin role
- **Parameter Validation**: Server-side validation of all template parameters
- **SQL Injection Prevention**: Proper parameter escaping and validation
- **Access Control**: Existing workspace permissions preserved for procedure creation

### 📝 Documentation
- **Template Guide**: Complete documentation for template creation and usage
- **API Documentation**: Updated API docs with template endpoints
- **Admin Guide**: Instructions for template management in admin panel

### 🧪 Testing
- **Unit Tests**: Comprehensive test coverage for template service and controller
- **Validation Tests**: Tests for template validation logic
- **Integration Tests**: End-to-end template rendering tests

---

## Previous Releases

### [Version X.X.X] - 2025-10-29
- Multi-workspace support with slug routing
- Workspace member management
- Environment configuration per workspace

### [Version X.X.X] - 2025-10-22
- Docker deployment support
- HTTP metrics instrumentation
- Activity feed implementation
- Admin workspace management