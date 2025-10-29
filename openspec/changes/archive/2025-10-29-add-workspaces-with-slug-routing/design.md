## Context

- Users are global with a simple Role model today (Admin/User); no tenancy/workspace.
- Desired: Multiple workspaces identified by `/c/:slug/` path, with per‑workspace roles and membership, no self‑registration, and platform admin who can manage any workspace.

## Goals / Non-Goals

- Goals: Workspace model + membership; path‑based routing; workspace‑scoped APIs; platform admin bypass; keep global usernames.
- Non‑Goals: Row‑level hard tenancy, per‑workspace custom authentication, or per‑workspace username namespaces.

## Decisions

- Path routing: All workspace‑scoped endpoints use `/c/:slug/…` to avoid coupling JWT to workspace and to allow easy switching.
- Workspace resolution: Guard/middleware fetches workspace by slug, 404 if not found, attaches `req.workspace` and `req.membership`.
- Membership roles: `Owner` (full workspace control), `Admin` (manage members and content), `Author` (create/update content), `Member` (read/limited actions).
- Platform admin: Use existing global Role('Admin') as platform‑admin; can bypass membership checks and operate in any workspace.
- Username uniqueness: Keep globally unique usernames to simplify cross‑workspace adds.
- Activities: Store `workspaceId` on activity records; list endpoint is `/c/:slug/activities` and is workspace‑scoped.

## Alternatives Considered

- Header‑based workspace selection (X‑Workspace‑Id): simpler backend wiring but less visible and not bookmarkable. Rejected.
- JWT‑embedded workspace: requires re‑login on switch and complicates token refresh. Rejected.

## Risks / Trade‑offs

- Route churn: Moving endpoints under `/c/:slug/` breaks existing clients → mitigate with a temporary compatibility layer for a default workspace.
- Role confusion: Two role systems (platform vs workspace) → resolve by scoping guards and returning the effective workspace role in workspace profile responses.
- Data backfill: Existing activities need a workspaceId; plan a default workspace and backfill script.

## Migration Plan

1. Ship schema + entities + guards behind feature flag if needed
2. Add new routes under `/c/:slug/…`; keep old routes as temporary proxies to a default workspace
3. Update frontend to use new routes and add workspace selector
4. Backfill data and remove old routes after deprecation window

## Open Questions

- Do we need per‑workspace settings (branding, limits)? Not in scope now.
- Should Owner be a distinct membership or a policy on Admin? Decided as a distinct role for clarity and “last owner” protection.
