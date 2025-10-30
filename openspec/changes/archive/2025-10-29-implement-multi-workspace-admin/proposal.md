## Why

Implement a comprehensive multi-workspace admin system to allow Platform Admins to create, manage, and administer multiple workspaces through a structured admin interface, enabling full multi-tenant workspace management beyond the current single default workspace.

## What Changes

- Add workspace creation API endpoints for Platform Admins
- Create comprehensive workspace management UI in admin panel with separate sub-menus
- Add workspace deletion and deactivation functionality
- Implement workspace listing and search capabilities
- Add workspace member management for workspace owners and Platform Admins
- Extend workspace switching to handle multiple workspaces
- Restructure app sidebar with separate Workspace and Platform navigation groups
- Simplify role structure: Platform Admin (global) + Owner/Author/Member (workspace-scoped)
- Enhance user creation workflow with optional workspace assignment
- Add cross-workspace member management capabilities for Platform Admins

## Breaking Changes

- Remove Workspace Admin role - simplify to Owner/Author/Member workspace roles
- Update admin panel navigation structure with sub-menus
- Restructure app sidebar navigation groups

## Impact

- Specs affected: workspaces (modified), admin (new), users (modified)
- Backend modules: workspace controller updates, admin panel extensions, user management enhancements
- Frontend: admin workspace management components, workspace selector enhancements, sidebar restructure
- Data: workspace creation/deletion workflows, audit trails, role simplification
- Navigation: Admin panel sub-menus, app sidebar group separation
