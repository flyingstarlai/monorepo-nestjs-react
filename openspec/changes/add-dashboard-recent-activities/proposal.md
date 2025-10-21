## Why
Users currently see hard-coded placeholders under "Recent Activity" in apps/web/src/routes/_dashboard/dashboard.tsx. A real activity feed improves awareness and trust by surfacing meaningful recent actions (e.g., login success, profile updates, password changes) directly on the dashboard.

## What Changes
- Add new capability: Activity Feed (per-user recent activities)
- Backend (NestJS):
  - New Activity entity + ActivitiesModule (service + controller)
  - Record events for: login success, profile updated, password changed, avatar updated
  - GET /activities: return current user’s recent activities (paginated, newest first)
- Frontend (React):
  - Query hook to fetch recent activities via TanStack Query
  - Replace static placeholders in _dashboard/dashboard.tsx with live data, including loading/empty/error states
  - Type-safe models and icon mapping by activity type
- Testing:
  - API unit tests for ActivityService.record and ActivitiesController list
  - E2E test: successful login creates an activity and appears in GET /activities
  - Web tests for loading/empty/success UI rendering

## Impact
- Affected specs: specs/activity-feed/spec.md (new capability)
- Affected code:
  - apps/api: new activities module, wire-in recordings in Auth/Users flows
  - apps/web: apps/web/src/routes/_dashboard/dashboard.tsx; new API client and query hook
  - Shared types: colocated in web codebase (no shared package yet)
- Data model: introduces Activity table; dev DB uses SQLite with synchronize=true (no explicit migration initially)
- Security: endpoint secured with JwtAuthGuard; returns sanitized actor fields only
