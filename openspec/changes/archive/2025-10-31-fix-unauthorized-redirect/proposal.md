## Why

When API calls return 401 Unauthorized errors, users are redirected to `/account` instead of `/login`, causing confusion and poor user experience.

## What Changes

- Add global event listener for `auth:logout` events in main.tsx
- Update auth state when logout event is dispatched
- Redirect to login page with proper redirect parameter
- Ensure auth state consistency across the application

## Impact

- Affected specs: state-management
- Affected code: apps/web/src/main.tsx, apps/web/src/features/auth/stores/auth.store.ts
- Fixes unauthorized redirect behavior while maintaining existing auth flow
