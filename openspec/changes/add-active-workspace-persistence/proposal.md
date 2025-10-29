## Why

After login, users are always redirected to the first workspace. This is confusing and inefficient when users work across multiple workspaces. Persisting the last active workspace and returning its slug at login enables consistent, device-independent redirects to the correct workspace.

## What Changes

- Data model: add `users.last_active_workspace_id` (UUID, nullable, FK -> workspaces(id)); optional `last_active_workspace_at` (timestamp) for auditing.
- Auth login response: include `activeWorkspaceSlug?: string | null` (non-breaking addition) computed server-side:
  - If `last_active_workspace_id` is present and still valid (workspace active AND user remains an active member) -> use that slug
  - Else fallback to first valid membership (prefer `DEFAULT_WORKSPACE_SLUG` if user is a member of it; otherwise earliest joinedAt; otherwise first by createdAt)
  - If no memberships -> null
- Workspace profile side-effect: on `GET /c/:slug/auth/profile` success, set `users.last_active_workspace_id` to the resolved workspace id (also allowed for Platform Admin bypass if enabled).
- Validation: before using `last_active_workspace_id` at login, validate membership and workspace activity; clear/ignore if invalid and recompute fallback.
- Frontend contract: extend AuthResponse to accept optional `activeWorkspaceSlug` and use it to navigate immediately after login.
- No breaking changes to existing clients; those ignoring the new field continue to work and will land on the first workspace via existing fallback.

## Impact

- Affected specs: auth (login response), workspaces (active workspace persistence)
- Affected backend code:
  - `apps/api/src/users/entities/user.entity.ts` (new column + optional relation)
  - `apps/api/src/auth/auth.service.ts` (compute and return `activeWorkspaceSlug`)
  - `apps/api/src/workspaces/controllers/workspace-auth.controller.ts` (set last active on profile access)
  - `apps/api/src/users/users.service.ts` (helpers to set/get/validate last active workspace)
  - Migration: `apps/api/src/migrations/postgres/005_add_last_active_workspace_to_users.ts`
- Affected frontend code:
  - `apps/web/src/features/auth/types` (AuthResponse type addition)
  - `apps/web/src/features/auth/stores/auth.store.ts` (propagate login response)
  - `apps/web/src/features/auth/components/login-form.tsx` (redirect using `activeWorkspaceSlug` if present)

## Notes / Non-Goals

- Non-goal: introducing a new endpoint to select active workspace; the side-effect on profile suffices for now. We can add `POST /c/:slug/auth/select` later if we prefer explicit selection.
- Non-goal: changing workspace routing or membership model (already established under `/c/:slug/...`).
- Security: Only set last active when caller is authorized for the workspace (member or platform admin bypass); do not leak workspace metadata otherwise.

## Rollout / Migration

- Add migration to create `last_active_workspace_id` and its FK + index.
- Deploy backend first (field is optional and response addition is non-breaking).
- Deploy frontend to start consuming `activeWorkspaceSlug` after backend is live.
- Backward-compatible: older web builds ignore the new field; newer web builds still work with older backends (they fall back to existing first-workspace redirect).
