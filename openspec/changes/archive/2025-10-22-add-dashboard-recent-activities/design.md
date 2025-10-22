## Context
We need a per-user Recent Activities feed on the dashboard. The backend is NestJS 11 with TypeORM (SQLite dev); the frontend is React 19 with TanStack Router/Query and shadcn UI. Current dashboard shows static placeholders. We will persist activity events and expose a secure API for retrieval.

## Goals / Non-Goals
- Goals:
  - Persist user-scoped activity events
  - Provide a secure, paginated endpoint for the current user’s recent activities
  - Render a live activity feed in the dashboard with empty/loading/error states
- Non-Goals (for this change):
  - Organization/tenant-wide activity streams (admin/global view)
  - Real-time streaming via WebSocket/SSE
  - Historical backfill for past events

## Data Model
Activity
- id: string (uuid)
- ownerId: string  // subject user whose feed this event belongs to
- type: enum
  - 'login_success' | 'profile_updated' | 'password_changed' | 'avatar_updated'
- message: string  // short, user-facing line
- metadata?: Record<string, any>  // optional, for future details
- createdAt: Date

Notes
- Use `ownerId` (not necessarily actor) so we can include both self-initiated and server-side events concerning the user. For v1, we only record self events (actor === ownerId). Future: add admin-driven events with ownerId = affected user.
- Keep message as a stored string to avoid complex joins while keeping UI simple. Future: localize messages.

## API Surface
- GET /activities?limit=20&cursor=ISO8601|id
  - Auth: JwtAuthGuard
  - Scope: ownerId = req.user.id
  - Sort: createdAt desc, stable cursor pagination (initially offset-less optional: `cursor` is the createdAt of the last item)
  - Response (200): `{ items: ActivityDto[], nextCursor?: string }`
  - Errors: 401 on missing/invalid JWT

ActivityDto
- id: string
- type: 'login_success' | 'profile_updated' | 'password_changed' | 'avatar_updated'
- message: string
- createdAt: string (ISO)

## Recording Hooks
- AuthController.login (on success): record { ownerId: user.id, type: 'login_success', message: 'Successfully logged in' }
- UsersController.updateProfile: record 'profile_updated'
- AuthController.changePassword: record 'password_changed'
- UsersController.updateAvatar: record 'avatar_updated'

## Decisions
- Use a dedicated ActivitiesModule for clean separation (controller/service/repo/entity)
- Store `message` denormalized for simplicity and deterministic display
- Limit scope to current user only; easy to extend later
- Query uses TanStack Query with staleTime ~30s and refetchOnWindowFocus for freshness

## Alternatives Considered
- Compute message on read (template + metadata); rejected for v1 due to added complexity and DB joins
- Global activity stream first; rejected to keep v1 minimal and focused
- Real-time updates; deferred to a later change

## Risks / Trade-offs
- Denormalized message may complicate future i18n → Mitigate by storing `type` and using message only as fallback
- Cursor pagination for SQLite may need careful ordering → Mitigate with createdAt indexed and secondary id tie-breaker

## Migration Plan
- Dev: no migration (TypeORM synchronize=true). For production: generate a migration to create `activity` table with indices on (ownerId, createdAt DESC).
- Rollback: safe to drop the table or ignore records; endpoint returns empty array if table missing (guard via feature flag if needed).

## Open Questions
- Should admin-initiated changes (role/status change) appear in the user’s feed in v1? Proposed: not in v1 to keep instrumentation minimal.
- Do we need a UI route for viewing more than the dashboard card? Proposed: not in v1 (keep within dashboard card with 5–10 items).
