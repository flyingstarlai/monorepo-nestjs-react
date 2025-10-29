## 1. Database Layer

- [x] 1.1 Create migration `005_add_last_active_workspace_to_users.ts`
  - Add `last_active_workspace_id` UUID NULL column to `users` table
  - Add foreign key constraint to `workspaces(id)` with ON DELETE SET NULL
  - Add index on `last_active_workspace_id` for performance
  - Optionally add `last_active_workspace_at` timestamp for auditing

## 2. Backend Entities and Services

- [x] 2.1 Update User entity
  - Add `lastActiveWorkspaceId?: string | null` field with `@Column({ name: 'last_active_workspace_id', nullable: true })`
  - Add optional relation to Workspace if needed for convenience

- [x] 2.2 Add helper methods to UsersService
  - `setLastActiveWorkspace(userId: string, workspaceId: string): Promise<void>`
  - `getActiveWorkspaceSlug(userId: string): Promise<string | null>` that validates membership and workspace activity
  - `clearLastActiveWorkspace(userId: string): Promise<void>`

- [x] 2.3 Update AuthService.login
  - After successful authentication, compute `activeWorkspaceSlug` using UsersService helper
  - Return `{ access_token, user, activeWorkspaceSlug }` in response
  - Ensure fallback logic: last active → DEFAULT_WORKSPACE_SLUG → earliest joined → first by createdAt → null

- [x] 2.4 Update WorkspaceAuthController.getProfile
  - After successful profile resolution, call `UsersService.setLastActiveWorkspace(userId, workspaceId)`
  - Ensure this only runs for valid members or platform admin bypass

## 3. Frontend Types and State

- [x] 3.1 Update AuthResponse type
  - Add optional `activeWorkspaceSlug?: string | null` to `apps/web/src/features/auth/types/index.ts`

- [x] 3.2 Update auth.store
  - Modify `login` method to return the full `AuthResponse` instead of void
  - Keep existing token/user setting logic unchanged

- [x] 3.3 Update login form redirect logic
  - After successful login, check `response.activeWorkspaceSlug`
  - If present and no redirect query param, navigate to `/c/${activeWorkspaceSlug}`
  - Honor existing `?redirect=` query param if provided and safe
  - Fallback to current behavior (navigate to `/`) if no active workspace

## 4. Validation and Rollout

- [x] 4.1 Run migration and verify database schema
- [x] 4.2 Test backward compatibility with existing API clients
- [x] 4.3 Verify frontend works with both new and old API responses
- [x] 4.4 Update documentation if needed