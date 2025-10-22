# Project Context

## Purpose

Monorepo for a modern dashboard with a NestJS API and a React web app. It delivers JWT authentication, role-based access control (Admin/User), and an Admin Panel to create users, enable/disable accounts, and change roles. Shared tooling (TypeScript, Biome, Jest/Vitest) and Turborepo keep code style, testing, and builds consistent and fast.

## Tech Stack

- Monorepo: PNPM workspaces, Turborepo 2
- Language/Runtime: TypeScript 5, Node >= 20
- Backend: NestJS 11, TypeORM 0.3, Passport (JWT), class-validator/transformer, bcrypt; DB: PostgreSQL 15 across dev/test/prod
- Frontend: React 19, Vite 7, TanStack Router v1 (file-based via plugin), TanStack Query v5, TanStack Table v8, Tailwind CSS v4, Shadcn UI (Radix UI), TanStack React Form + Zod, Sonner toasts; env-based API URL via `VITE_API_BASE_URL`
- Testing: Jest 29 for API (unit + e2e), Vitest 3 + Testing Library for web
- Lint/Format: Biome 2 everywhere with shared config (@repo/biome-config)
- Devtools: TanStack Devtools (Router + Query)

## Project Conventions

### Code Style

- TypeScript first; strict settings via shared configs in `@repo/typescript-config` (ES2022 target; NodeNext/bundler resolution)
- Formatting and linting via shared Biome config (`@repo/biome-config`); single quotes, 2-space indent, 100-char line width; kebab-case filenaming enforced; use `pnpm run check` in apps/web or apps/api for Biome operations; for individual commands use `npx @biomejs/biome format --write`
- React: components in PascalCase; hooks prefixed with `use*`; colocate feature code under `src/features/*`; route files follow TanStack Router file-based naming (`__root.tsx`, `/_dashboard.tsx`)
- Imports: web uses `@/*` path alias; prefer named exports; avoid default exports for shared modules
- Tailwind CSS utility-first styling; avoid ad-hoc CSS files beyond global base
- NestJS: DTO classes with `class-validator`; entities under `entities/`; controllers only orchestrate and map to HTTP exceptions; services hold business logic; never return passwords (sanitize responses)

### Architecture Patterns

- Backend (NestJS): modular architecture (AuthModule, UsersModule); TypeORM repositories for data access; JWT auth via Passport strategy + `JwtAuthGuard`; role checks via `@Roles()` decorator and `RolesGuard`; avatar uploads via Multer (2MB limit)
- Database: PostgreSQL (`dashboard` database) with TypeORM migrations; entities `User`, `Role`, `Activity` (users eager-load roles). Seeds ensure roles (Admin/User) and default admin/user credentials
- Frontend (React): feature-first structure; file-based routing with TanStack Router; `QueryClient` and Auth context injected via root route context; Admin route guarded in `beforeLoad` by role
- Data fetching/state: TanStack Query for queries/mutations, optimistic UX, and invalidation (e.g., invalidate `['admin','users']` after mutations)
- API boundaries: REST endpoints under `/auth`, `/users`, and `/activities`; server returns sanitized user shapes (no password) and stable activity contracts `{ id, type, message, createdAt }`; consistent Nest exceptions map to client errors
- Build/dev: Vite for web; Turborepo orchestrates `dev`, `build`, `lint`, `test` across workspaces

### Testing Strategy

- API: Jest for unit/integration; `apps/api/test/jest-e2e.json` for e2e tests. Prioritize AuthService.validateUser (disabled user denied), UsersService safety rules (self-protection, last-admin protection), and controller exception mapping
- Web: Vitest + React Testing Library + JSDOM; test hooks (queries/mutations) and route guards; prefer component-level tests over snapshots; keep tests colocated near the unit
- CI/local gates: run `pnpm lint && pnpm test && pnpm build` before merging; aim for meaningful coverage on auth/admin flows
- Fixtures: seed data creates Admin `admin/nimda` and User `user/user123` for local dev

### Git Workflow

- Branching: trunk-based on `main` with short-lived feature branches (`feat/*`, `fix/*`, `chore/*`)
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`…); keep scope per package/app when helpful (e.g., `feat(api): add role guard`)
- PRs: small, focused; must pass `lint`, `test`, and build tasks via Turborepo; request review for changes to shared packages
- Releases: not automated yet; no changesets; deploy/release steps TBD

## Domain Context

- User roles: exactly two roles today — `Admin` and `User`
- Admin capabilities: create user (with role), enable/disable account, change role; enforced on server with `JwtAuthGuard` + `RolesGuard('Admin')`
- Safety rules: self-protection (admin cannot disable/demote self) and last-admin protection (cannot remove last active admin)
- Sanitization: API never returns `password`; user responses look like `{ id, username, name, role, avatar?, isActive, createdAt, updatedAt }`
- Frontend Admin Panel uses TanStack Query for users/roles and exposes UI controls for role/status with proper confirmations and disabled self-actions

## Important Constraints

- Node.js >= 20
- Dev DB: PostgreSQL via Docker (dashboard/dashboard123 by default); migrations required—`synchronize` disabled in all environments
- Avatars: image-only uploads, max 2MB (enforced by Multer and controller)
- Auth: disabled users cannot log in; JWT secret and expiry must be configured; tokens stored in `localStorage` on the web
- API base URL is configurable via `VITE_API_BASE_URL` (defaults to `http://localhost:3000`)

## External Dependencies

- External services: none required at runtime; the stack is self-contained
- Optional: Turborepo Remote Caching via Vercel for faster CI/local builds
- Libraries of note: Radix UI (via shadcn/ui), Lucide icons, TanStack devtools; no third-party SaaS integrations

## Current Status

- Authn/Authz: JWT login with disabled-user checks; profile and avatar updates; change-password endpoint; server enforces `JwtAuthGuard` + `RolesGuard`; admin route guarded client-side in `beforeLoad`.
- User Admin: Admin can create users, enable/disable accounts, and change roles; safety rules enforced (self-protection and last-admin protection); API responses are sanitized.
- Activities Feed: Activity entity and `GET /activities` with `limit` and `cursor` pagination; server records `login_success`, `profile_updated`, `password_changed`, `avatar_updated`; dashboard shows a Recent Activity card with loading, empty, and error states.
- Observability: Prometheus metrics exposed at `/metrics`; HTTP metrics interceptor records `http_server_requests_total` and `http_server_requests_duration_seconds` labeled by method, route pattern, and status; route normalization prevents cardinality spikes; dev stack includes Prometheus and a pre-provisioned Grafana dashboard (`grafana/dashboards/api-metrics.json`); see `docs/OBSERVABILITY_RUNBOOK.md`.
- Logging: Structured logging with `nestjs-pino`; request correlation via `x-request-id` interceptor; sensitive fields redacted; pretty logs in development.
- Docker & Deployment: Dev and prod Dockerfiles and Compose files; optional Nginx reverse proxy with TLS and rate limiting; helper scripts `build-docker.sh` and `deploy.sh`; environment-driven config for API base URL and JWT settings.
- Testing: API e2e tests cover `/metrics` and `/activities`; Jest used for API, Vitest + Testing Library for web; local gate remains `pnpm lint && pnpm test && pnpm build`.
- Constraints: Node >= 20; PostgreSQL 15; TypeORM migrations enabled (`migrationsRun: true`); avatars limited to 2MB.
