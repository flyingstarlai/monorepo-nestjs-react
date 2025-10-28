## Why

The current activities system conflates user activities (profile updates, logins) with workspace activities, creating contextual confusion. User actions like profile updates are being displayed in workspace context where they don't belong, while workspace-specific activities (member management, settings changes) are not properly tracked. This separation is needed for clear user experience and proper activity categorization.

## What Changes

### Backend Changes

**Activities Entity Enhancement**
- **ADDED**: `scope` field with enum: `'user' | 'workspace'`
- **MODIFIED**: `record()` method to accept optional `scope` parameter
- **BREAKING**: Activity records now require explicit scope designation

**Activities Service Updates**
- **MODIFIED**: `record()` method to store scope with activity
- **MODIFIED**: `findByOwner()` to filter by user scope only
- **ADDED**: `findByWorkspace()` method for workspace-scoped activities
- **MODIFIED**: `findByWorkspaceAndOwner()` to use both workspace and scope filters

**API Controller Updates**
- **MODIFIED**: Activities controller to use new scoped methods
- **ADDED**: WorkspaceActivities controller methods for workspace-specific activity recording
- **MODIFIED**: User profile update endpoint to record user-scoped activities

### Frontend Changes

**Separate Activity Hooks**
- **ADDED**: `useUserActivities()` hook for global user activities
- **ADDED**: `useWorkspaceActivities()` hook for workspace-specific activities  
- **MODIFIED**: Dashboard to use `useUserActivities()` instead of workspace activities
- **MODIFIED**: Activities page to use `useWorkspaceActivities()`

**Activity Type Separation**
- **ADDED**: User activity types: `profile_updated`, `login_success`, `password_changed`, `avatar_updated`
- **ADDED**: Workspace activity types: `member_joined`, `member_removed`, `role_changed`, `workspace_settings_updated`

## Impact

### Affected Specs
- **activities**: Core activity tracking and display requirements
- **auth**: User profile update activity recording integration

### Affected Code
- `apps/api/src/activities/activities.service.ts`: Core activity business logic
- `apps/api/src/activities/activities.controller.ts`: Global activities API
- `apps/api/src/activities/entities/activity.entity.ts`: Activity data model
- `apps/api/src/workspaces/controllers/workspace-activities.controller.ts`: Workspace activities API
- `apps/api/src/users/users.controller.ts`: Profile update activity recording
- `apps/web/src/features/activities/hooks/use-recent-activities.ts`: Frontend data fetching
- `apps/web/src/features/activities/hooks/use-user-activities.ts`: New user activities hook
- `apps/web/src/features/activities/hooks/use-workspace-activities.ts`: New workspace activities hook
- `apps/web/src/routes/_dashboard/c.$slug.overview.tsx`: Dashboard activities display
- `apps/web/src/routes/_dashboard/c.$slug.activities.tsx`: Activities page display

## Risks / Trade-offs

### Risks
- **Breaking change**: Existing activity records without scope will need migration
- **Data consistency**: Risk of duplicate activities if scope not properly designated
- **Frontend complexity**: Two separate hooks increase cognitive load

### Mitigations
- **Database migration**: Add default scope for existing activities
- **Comprehensive testing**: Verify both user and workspace activity flows
- **Clear documentation**: Explicit guidance on when to use each scope
- **Gradual rollout**: Implement backend first, then frontend changes

## Migration Plan

### Phase 1: Backend Implementation
1. Update Activity entity with scope field and migration
2. Enhance ActivitiesService with scoped methods
3. Update controllers to use appropriate scoping
4. Add workspace-specific activity recording endpoints
5. Run database migration for existing data

### Phase 2: Frontend Implementation  
1. Create separate hooks for user and workspace activities
2. Update dashboard to use user activities
3. Update activities page to use workspace activities
4. Add proper error handling and loading states
5. Update activity type definitions and icons

### Phase 3: Testing & Validation
1. Test user activity recording (profile, login, password)
2. Test workspace activity recording (member changes, settings)
3. Verify proper separation in dashboard and activities page
4. Test pagination and cursor-based navigation
5. Validate performance with activity volume

## Open Questions

- Should existing activities without scope be migrated as 'user' scope by default?
- Should workspace administrators be able to see user activities in workspace context?
- Should there be a combined view showing both user and workspace activities?
