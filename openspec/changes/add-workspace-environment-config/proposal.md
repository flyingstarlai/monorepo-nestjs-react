## Why

Enable workspaces to connect to their own MS SQL databases for independent data isolation and customization while maintaining centralized workspace management.

## What Changes

- Add Environment entity to store MS SQL connection configuration per workspace
- Create API endpoints for environment CRUD operations with role-based access control
- Implement connection testing functionality for environment validation
- Add Environment configuration UI to existing "Advanced Settings" section
- Support dynamic database connections per workspace
- Add migration strategy for existing workspaces

## Impact

- Affected specs: workspaces, database
- Affected code: workspace entities, services, controllers; frontend settings components; database configuration
- **BREAKING**: Database schema changes and new connection handling patterns