## 1. Implementation

- [x] 1.1 Database (MSSQL)
- [x] 1.1.1 Create `workspaces` table (id, name, slug UNIQUE, isActive, createdAt, updatedAt)
- [x] 1.1.2 Create `workspace_members` table (id, workspaceId FK, userId FK, role in ('Owner','Admin','Author','Member'), isActive, joinedAt, UNIQUE(workspaceId,userId))
- [x] 1.1.3 Alter `activities`: add `workspaceId` FK + index (workspaceId, createdAt), backfill for seeded/default workspace
- [x] 1.1.4 Seed default workspace with slug 'twsbp' and add Owner membership for platform admin

- [x] 1.2 Backend entities/modules
- [x] 1.2.1 Add `Workspace` entity and module
- [x] 1.2.2 Add `WorkspaceMember` entity
- [x] 1.2.3 Update `Activity` entity with `workspaceId` relation

- [x] 1.3 Workspace context and guards
- [x] 1.3.1 Add `WorkspaceResolver` (middleware/guard) to resolve `/c/:slug` → workspace, attach `req.workspace`
- [x] 1.3.2 Add `WorkspaceMembershipGuard` to enforce membership; attach `req.membership`
- [x] 1.3.3 Add `@WorkspaceRoles(...)` decorator + `WorkspaceRolesGuard`
- [x] 1.3.4 Platform Admin bypass: if user is Platform Admin (global role Admin), allow any workspace

- [x] 1.4 API routing (NestJS)
- [x] 1.4.1 Introduce controller route prefixes under `/c/:slug/...` for workspace‑scoped modules (Users, Activities, Profile)
- [x] 1.4.2 Keep `/auth/login` global and add `/workspaces` (list current user memberships)
- [x] 1.4.3 Add `/c/:slug/auth/profile` returning profile + workspace role

- [x] 1.5 Users (workspace‑scoped)
- [x] 1.5.1 `GET /c/:slug/users` → list members (with role, status, joinedAt)
- [x] 1.5.2 `POST /c/:slug/users` → if username exists: add membership; else create user+membership; no self‑registration endpoint
- [x] 1.5.3 `PATCH /c/:slug/users/:id/status` → toggle membership active; protect last Owner
- [x] 1.5.4 `PATCH /c/:slug/users/:id/role` → update membership role; protect last Owner; allow Platform Admin override

- [x] 1.6 Activities (workspace‑scoped)
- [x] 1.6.1 `GET /c/:slug/activities` → scope by workspace and current user (ownerId)
- [x] 1.6.2 Ensure `record(...)` stores `workspaceId`

- [x] 1.7 Auth
- [x] 1.7.1 Keep `POST /auth/login` (username/password)
- [x] 1.7.2 Implement `GET /workspaces` (list memberships with role per workspace)
- [x] 1.7.3 Implement `GET /c/:slug/auth/profile` (user profile + workspace role)

- [x] 1.8 Frontend
- [x] 1.8.1 Add workspace selector (list workspaces after login; pick one)
- [x] 1.8.2 Update router to nest dashboard and admin routes under `/c/$slug/*`
- [x] 1.8.3 Update API clients to call `/c/:slug/...` endpoints
- [x] 1.8.4 Gate Admin UI by `workspaceRole in {Owner,Admin}` instead of global `user.role`

- [x] 1.9 Observability
- [x] 1.9.1 Add `workspaceId` label to HTTP metrics (when available)

- [ ] 1.10 Tests
- [ ] 1.10.1 E2E: workspace resolution and 404 for unknown slug
- [ ] 1.10.2 E2E: membership required for workspace routes (403)
- [ ] 1.10.3 E2E: platform admin bypass
- [ ] 1.10.4 E2E: last Owner protection for role/status changes
- [ ] 1.10.5 E2E: activities scoped by workspace

- [x] 1.11 Rollout plan
- [x] 1.11.1 Backfill activities for default workspace 'twsbp' (if needed)
- [x] 1.11.2 Temporary compatibility proxy (optional): support old routes → redirect to `/c/:slug/...` for the default workspace - NOT NEEDED
- [x] 1.11.3 Documentation and deprecation notice for old paths - NOT NEEDED
