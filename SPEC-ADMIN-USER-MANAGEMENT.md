# Admin User Management — Technical Spec

Summary

- Add admin capabilities for managing users: create user, enable/disable user, change user role.
- Enforce server-side authorization and safety rules (self-protection, last-admin protection).
- Provide a simple Admin Panel UI wired to new endpoints with TanStack Query.

Background

- Current system has Users and Roles (Admin/User), JWT-based auth, and a protected Admin route stub in the web app.
- Users table includes isActive (boolean), role eager relation, and basic CRUD in UsersService, plus profile/avatar updates for the current user.
- API lacks admin-only operations and safety guards; the UI uses mock data.

Goals

- Admin can:
  1. Create a new user with role assignment.
  2. Enable/disable a user account.
  3. Change a user’s role (promote/demote between Admin/User).
- Harden auth and ensure sanitized responses (no passwords ever returned).

Non‑Goals

- Fine-grained permissions beyond Admin/User.
- Audit logging or soft delete.
- Bulk user import.

Backend Design (NestJS)

Entities (existing)

- User: { id, username, name, password, role, roleId, avatar?, isActive, createdAt, updatedAt }
- Role: { id, name: 'Admin' | 'User', description?, createdAt, updatedAt }

Auth changes

- AuthService.validateUser(username, password)
  - Deny login if user.isActive === false.
  - Throw UnauthorizedException('User is disabled') for disabled users.
- JwtStrategy: already returns sanitized user payload; keep as-is.

Authorization

- Protect admin operations with JwtAuthGuard + RolesGuard('Admin').
- Keep /users/profile and /users/avatar for authenticated users (self updates only).
- Optionally expose GET /roles to any authenticated user; default: authenticated.

DTOs

- CreateUserDto
  - username: string (required, unique)
  - name: string (required)
  - password: string (required, min length 6–8)
  - roleName: 'Admin' | 'User' (required)
- UpdateUserStatusDto
  - isActive: boolean (required)
- UpdateUserRoleDto
  - roleName: 'Admin' | 'User' (required)

Endpoints

- POST /users (Admin)
  - Body: CreateUserDto
  - Behavior: hash password, find role by roleName, create user, return sanitized user
  - Errors: 400 on bad input/duplicate username; 404 if role not found
- PATCH /users/:id/status (Admin)
  - Body: UpdateUserStatusDto
  - Behavior: set isActive; enforce server-side safety rules (see below); return sanitized user
- PATCH /users/:id/role (Admin)
  - Body: UpdateUserRoleDto
  - Behavior: change role; enforce server-side safety rules; return sanitized user
- GET /users (Admin)
  - Behavior: list all users; return sanitized list
- GET /roles (Auth)
  - Behavior: list roles for UI selection

Sanitized Response Shape

- UserResponse: { id, username, name, role: string, avatar?: string, isActive: boolean, createdAt?: string, updatedAt?: string }
- Never include password.

Server‑Side Safety Rules

- Self-protection: Admin cannot disable or demote self.
- Last-admin protection: Prevent actions that would leave the system with zero active Admin users.
  - When disabling or demoting a user with role Admin, ensure there remains at least one active Admin after the change.

Validation & Errors

- Use class-validator on DTOs. Return consistent error messages:
  - 400: Validation failed or duplicate username.
  - 401: Disabled user login attempt.
  - 403: Non-admin hitting admin routes.
  - 404: User/Role not found.

Implementation Notes

- UsersService
  - add: createAdminUser/createRegularUser helpers for seed (optional) or continue using generic create with roleName lookup.
  - add: setActive(userId, isActive), setRole(userId, roleName).
  - add: countActiveAdmins(): number — helps enforce last-admin protection.
  - always return sanitized users from controller; use mapping to omit password.
- UsersController
  - Guard admin endpoints: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('Admin')
  - Keep profile/avatar endpoints under JwtAuthGuard only.
- AuthController
  - no changes to routes; only change validateUser logic.

Seed/Init

- Ensure roles 'Admin' and 'User' exist. The current seed endpoint creates them; keep it for local/dev.

Frontend Design (React + TanStack)

Types

- Extend User type to include isActive: boolean.

Admin API Module

- listUsers(): GET /users
- listRoles(): GET /roles
- createUser(payload: { username, name, password, roleName }): POST /users
- setUserActive(id, isActive): PATCH /users/:id/status
- setUserRole(id, roleName): PATCH /users/:id/role
- All requests use Bearer token from tokenStorage.

Admin Panel UI (/admin route)

- Replace mock data with TanStack Query (users, roles).
- Add "Add User" dialog:
  - Fields: username, name, password, role select (from roles query)
  - On submit: createUser() → invalidate users query; show toast.
- User table enhancements:
  - Active toggle: setUserActive(); optimistic update; revert on error; confirmation when disabling.
  - Role select: setUserRole(); confirmation when demoting Admin; block self-change in UI.
  - Optional delete action: out of scope for now; prefer disable over delete.
- UX guards:
  - Disable controls on current user where not allowed (self-disable/demote).
  - Show clear error toasts on server rejections (e.g., last-admin protection).

Routing & Access

- Admin route already checks role === 'Admin' in beforeLoad; keep as-is.

Testing Plan

- Manual
  - Create user (User role), login as new user, verify access.
  - Disable user, attempt login, expect failure.
  - Promote user to Admin, verify admin route accessible; demote back to User, verify redirect/denial.
  - Attempt to disable/demote self — blocked in UI and API.
  - Attempt to disable/demote the last Admin — API rejects.
- Automated (optional)
  - E2E: admin-only access, disabled user login, role change effects on routing.
  - Unit: UsersService safety rules (self-protection, last-admin protection), AuthService.validateUser denies disabled users.

Rollout

- Phase 1: Backend endpoints + guards + DTOs + isActive check in AuthService.
- Phase 2: Frontend API + Admin Panel wiring + UI/UX safeguards.
- Phase 3: Polish and tests; verify seed data and basic flows in dev.

Open Questions

- Should GET /roles be admin-only or any authenticated user? (default: authenticated)
- Do we want delete user semantics now or keep disable-only? (default: disable-only)
- Future: more role types or permissions beyond Admin/User?
