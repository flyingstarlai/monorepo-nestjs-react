## Why

Introduce multiple workspaces identified by company slug in the URL path (`/c/:slug/`) so a single global user account can work across many workspaces. Enforce workspace membership and roles (Owner/Admin/Author/Member). Keep usernames globally unique. Preserve “no self‑registration”; users are created/added by admins. Platform Admin can manage any workspace.

## What Changes

- Workspace model with unique `slug` and active flag
- Workspace membership (many‑to‑many User↔Workspace) with roles `Owner` | `Admin` | `Author` | `Member`
- Path‑based routing for all workspace‑scoped APIs under prefix `/c/:slug/…`
- Guards/middleware to resolve `:slug`, validate membership, and inject workspace context
- Platform Admin bypass: global admin can operate on any workspace without membership
- Users API becomes workspace‑scoped: list members, add existing user, create new user+membership, change role/status
- Activities API becomes workspace‑scoped: `GET /c/:slug/activities`, record with `workspaceId`
- Auth remains username/password; add workspace‑scoped profile `GET /c/:slug/auth/profile`; add `GET /workspaces` to list memberships
- Keep usernames globally unique; no self‑registration

## Breaking Changes

- Workspace‑scoped endpoints move under `/c/:slug/…` (e.g., `/users` → `/c/:slug/users`, `/activities` → `/c/:slug/activities`)
- Existing clients must begin passing a workspace slug in the path

## Impact

- Specs affected: workspaces (new), users (new), auth (new), activity‑feed (modified)
- Backend modules: new Workspace and WorkspaceMember entities/module; updates to Users, Activities, Auth, and guards
- Frontend: router and API clients updated to include `/c/:slug/` prefix; workspace selector UX; admin gating by workspace role
- Data: new tables `workspaces`, `workspace_members`; add `workspaceId` to `activities`
