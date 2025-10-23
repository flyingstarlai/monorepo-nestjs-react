## 1. Implementation

- [x] 1.1 API: Create Activity entity (id, ownerId, type, message, metadata?, createdAt)
- [x] 1.2 API: Add ActivitiesModule (service + repository + controller)
- [x] 1.3 API: Implement GET /activities (JwtAuthGuard; ownerId = req.user.id; limit, cursor)
- [x] 1.4 API: Instrument event recording
  - [x] 1.4.1 On login success -> record `login_success`
  - [x] 1.4.2 On profile update -> record `profile_updated`
  - [x] 1.4.3 On password change -> record `password_changed`
  - [x] 1.4.4 On avatar update -> record `avatar_updated`
- [x] 1.5 Web: Add API client + query hook `useRecentActivities({limit})`
- [x] 1.6 Web: Replace static Recent Activity UI in `apps/web/src/routes/_dashboard/dashboard.tsx` with live data
- [x] 1.7 Web: Add loading skeleton, empty state, and inline error fallback

## 2. Testing

- [x] 2.1 API unit tests: ActivityService.record, ActivitiesController.list
- [x] 2.2 API e2e test: login -> GET /activities returns `login_success`
- [x] 2.3 Web component tests: loading/empty/success render paths

## 3. Documentation & Ops

- [x] 3.1 Update README (api/web) with new endpoint and UI behavior
- [x] 3.2 No migrations needed for dev (TypeORM synchronize=true); note production migration plan

## 4. Rollout & Validation

- [x] 4.1 Run `openspec validate add-dashboard-recent-activities --strict`
- [x] 4.2 Local verification: manual login, profile edits, password change -> verify feed updates
- [x] 4.3 PR with CI gates (lint, test, build)
