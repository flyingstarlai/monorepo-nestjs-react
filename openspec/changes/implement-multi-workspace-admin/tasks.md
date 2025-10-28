## 1. Backend API Implementation

- [x] 1.1 Add workspace creation endpoint
- [x] 1.1.1 POST /admin/workspaces (Platform Admin only)
- [x] 1.1.2 Validate workspace slug uniqueness and format
- [x] 1.1.3 Auto-create Owner membership for creating admin
- [ ] 1.1.4 Record workspace creation activity

- [x] 1.2 Add workspace management endpoints
- [x] 1.2.1 GET /admin/workspaces (list all workspaces for Platform Admin)
- [x] 1.2.2 PATCH /admin/c/:slug (update workspace details)
- [x] 1.2.3 DELETE /admin/c/:slug (soft delete with deactivation)
- [ ] 1.2.4 POST /admin/c/:slug/activate (reactivate workspace)

- [x] 1.3 Add workspace member management for Owners and Platform Admins
- [x] 1.3.1 Workspace-scoped: GET /c/:slug/users (Owners can list members)
- [x] 1.3.2 Workspace-scoped: POST /c/:slug/users (Owners can add members)
- [x] 1.3.3 Workspace-scoped: PATCH /c/:slug/users/:userId/role (Owners can change roles; last Owner protection)
- [x] 1.3.4 Workspace-scoped: PATCH /c/:slug/users/:userId/status (Owners can deactivate members; last Owner protection)
- [x] 1.3.5 Admin-scoped: GET /admin/c/:slug/members (Platform Admin can list members for any workspace)
- [x] 1.3.6 Admin-scoped: POST /admin/c/:slug/members (Platform Admin can add members to any workspace)
- [x] 1.3.7 Admin-scoped: PATCH /admin/c/:slug/members/:userId/role (Platform Admin can change roles; MUST provide replacementOwnerUserId if removing last Owner)
- [x] 1.3.8 Admin-scoped: PATCH /admin/c/:slug/members/:userId/status (Platform Admin can deactivate members; MUST provide replacementOwnerUserId if deactivating last Owner)

- [x] 1.4 Enhance user creation with workspace assignment
- [x] 1.4.1 POST /users (enhanced to support optional workspace assignment)
- [x] 1.4.2 Attempt default workspace assignment via `DEFAULT_WORKSPACE_SLUG` when unspecified; SKIP if missing or inactive (no error)
- [x] 1.4.3 Support creating users with specific workspace roles

- [ ] 1.5 Role structure simplification
- [ ] 1.5.1 Remove Workspace Admin role from database and API
- [ ] 1.5.2 Update all workspace role references to Owner/Author/Member only
- [ ] 1.5.3 Update permission checks to reflect simplified role structure

- [ ] 1.6 Audit & Observability
- [ ] 1.6.1 Record audit events for workspace create/update/deactivate/reactivate, membership add/remove, and role/status changes (include actor and workspaceId)
- [x] 1.6.2 Metrics: ensure admin and membership endpoints expose workspaceId labels where applicable

- [x] 1.7 Pagination & Search
- [x] 1.7.1 Add pagination/sort/filter to GET /admin/workspaces
- [x] 1.7.2 Add pagination/sort/search to GET /admin/c/:slug/members

## 2. Frontend Admin Panel Restructure

- [x] 2.1 Create admin navigation structure with sub-menus
- [x] 2.1.1 AdminLayout component with sidebar navigation
- [x] 2.1.2 AdminSidebar component with Users/Workspaces/Settings sections
- [x] 2.1.3 AdminDashboard with feature-specific quick actions
- [x] 2.1.4 Route structure: /admin/users/*, /admin/workspaces/* (listing and creation), /admin/c/:slug* (workspace details), /admin/settings/*

- [x] 2.2 Create Users management section
- [x] 2.2.1 /admin/users/create (enhanced user creation with workspace assignment)
- [x] 2.2.2 /admin/users/list (global user management - existing functionality)
- [x] 2.2.3 /admin/users/:id (user details with workspace memberships)
- [x] 2.2.4 Enhanced AddUserDialog with workspace assignment options

- [x] 2.3 Create Workspaces management section
- [x] 2.3.1 /admin/workspaces/create (workspace creation form)
- [x] 2.3.2 /admin/workspaces/list (all workspaces listing)
- [x] 2.3.3 /admin/c/:slug (workspace details and editing)
- [x] 2.3.4 /admin/c/:slug/members (workspace member management)

- [x] 2.4 Create workspace management components
- [x] 2.4.1 WorkspaceList component (display all workspaces)
- [x] 2.4.2 WorkspaceForm component (create/edit workspace)
- [x] 2.4.3 WorkspaceCard component (workspace summary with actions)
- [x] 2.4.4 WorkspaceMembers component (member management for owners and admins)
- [x] 2.4.5 AddWorkspaceMemberDialog (add existing or create new user)

## 3. App Sidebar Navigation Restructure

- [x] 3.1 Update AppSidebar with separate navigation groups
- [x] 3.1.1 Create Workspace group for workspace-specific features
- [x] 3.1.2 Create Platform group for platform-level features
- [x] 3.1.3 Update NavMain component to support multiple groups
- [x] 3.1.4 Add Activities link to workspace navigation

- [x] 3.2 Implement contextual navigation
- [x] 3.2.1 Show workspace items only when workspace is selected
- [x] 3.2.2 Show management items only for appropriate roles
- [x] 3.2.3 Add My Profile to Platform group
- [x] 3.2.4 Add Platform Admin to Platform group (Admins only)

## 4. Enhanced Workspace Selector

- [x] 4.1 Update workspace selector functionality
- [x] 4.1.1 Fetch all user workspaces from /workspaces
- [x] 4.1.2 Add search/filter functionality
- [x] 4.1.3 Show workspace role indicators
- [x] 4.1.4 Handle workspace switching seamlessly

## 5. API Integration

- [x] 5.1 Create workspace API client methods
- [x] 5.1.1 createWorkspace(workspaceData)
- [x] 5.1.2 updateWorkspace(id, updates)
- [x] 5.1.3 deleteWorkspace(id)
- [x] 5.1.4 getAllWorkspaces() (Platform Admin only)
- [x] 5.1.5 getWorkspaceMembersAdmin(id)
- [x] 5.1.6 addWorkspaceMemberAdmin(workspaceId, memberData)
- [x] 5.1.7 updateWorkspaceMemberRoleAdmin(workspaceId, userId, role)
- [x] 5.1.8 createUserWithWorkspace(userData) (enhanced user creation)

- [x] 5.2 Add workspace management mutations
- [x] 5.2.1 useCreateWorkspaceMutation
- [x] 5.2.2 useUpdateWorkspaceMutation
- [x] 5.2.3 useDeleteWorkspaceMutation
- [x] 5.2.4 useWorkspaceMemberMutations
- [x] 5.2.5 useCreateUserWithWorkspaceMutation

- [x] 5.3 Update admin API client
- [x] 5.3.1 Enhance createUser to support workspace assignment
- [x] 5.3.2 Add workspace management methods
- [ ] 5.3.3 Update role management to reflect simplified structure

## 6. Data Model Updates

- [ ] 6.1 Update workspace role definitions
- [ ] 6.1.1 Remove Workspace Admin from WorkspaceRole enum
- [ ] 6.1.2 Update TypeScript interfaces to remove Admin workspace role
- [ ] 6.1.3 Update database constraints if needed

- [ ] 6.2 Update user creation workflow
- [ ] 6.2.1 Add default workspace assignment logic
- [ ] 6.2.2 Support optional workspace assignment during user creation
- [ ] 6.2.3 Handle multi-workspace membership scenarios

## 7. Testing

- [x] 7.1 Backend tests
- [x] 7.1.1 Workspace creation validation
- [x] 7.1.2 Platform Admin authorization
- [x] 7.1.3 Workspace member management permissions
- [x] 7.1.4 Workspace deactivation/reactivation
- [ ] 7.1.5 Role simplification compatibility
- [x] 7.1.6 User creation with workspace assignment

- [x] 7.2 Frontend tests
- [x] 7.2.1 Admin navigation structure
- [x] 7.2.2 Workspace form validation
- [x] 7.2.3 Workspace list rendering
- [x] 7.2.4 Member management interactions
- [x] 7.2.5 User creation with workspace assignment
- [x] 7.2.6 Sidebar navigation groups
- [x] 7.2.7 Workspace switching behavior

## 8. Documentation & Cleanup

- [ ] 8.1 Update API documentation
- [ ] 8.2 Add workspace management guide
- [ ] 8.3 Update admin panel documentation
- [ ] 8.4 Document role structure changes
- [ ] 8.5 Archive completed OpenSpec change