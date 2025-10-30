## ADDED Requirements

### Requirement: Admin Panel Navigation Structure

The system SHALL provide a comprehensive admin interface with separate sub-menus for Users, Workspaces, and Settings management.

#### Scenario: Admin panel main dashboard

- WHEN a Platform Admin navigates to /admin
- THEN they see a dashboard with separate sections for Users and Workspaces
- AND quick action buttons for each feature area

#### Scenario: Users management navigation

- WHEN Platform Admin clicks Users section
- THEN they see sub-menu items: Create User, Manage Users
- AND can navigate to /admin/users/create and /admin/users/list

#### Scenario: Workspaces management navigation

- WHEN Platform Admin clicks Workspaces section
- THEN they see sub-menu items: Create Workspace, Manage Workspaces
- AND can navigate to /admin/workspaces/create and /admin/workspaces/list (listing), and to workspace details via /admin/c/:slug

#### Scenario: Settings management navigation

- WHEN Platform Admin clicks Settings section
- THEN they see sub-menu items: System Settings
- AND can navigate to /admin/settings

### Requirement: Enhanced User Creation Interface

The system SHALL provide an enhanced user creation interface that supports optional workspace assignment.

#### Scenario: User creation with workspace assignment

- WHEN Platform Admin fills user creation form
- THEN they can optionally assign the user to a workspace
- AND select workspace role (Owner/Author/Member)

#### Scenario: Default workspace assignment

- WHEN Platform Admin creates user without specifying workspace
- THEN system automatically assigns user to the default workspace (configured via `DEFAULT_WORKSPACE_SLUG`) as Member; if missing or inactive, the system SKIPS workspace assignment without error
- AND shows this default assignment in the form

#### Scenario: Skip workspace assignment

- WHEN Platform Admin chooses to skip workspace assignment
- THEN system creates user without any workspace membership
- AND user must be manually added to workspaces later

#### Scenario: Create new user for specific workspace

- WHEN Platform Admin selects specific workspace and role
- THEN system creates global user and adds them to workspace with specified role
- AND returns confirmation of both user creation and workspace assignment

### Requirement: Workspace Management Interface

The system SHALL provide a comprehensive interface for Platform Admins to create, edit, and manage workspaces.

#### Scenario: Create workspace form

- WHEN Platform Admin navigates to /admin/workspaces/create
- THEN they see form with workspace name, slug, and description fields
- AND validation for slug uniqueness and format

#### Scenario: Workspace listing with management

- WHEN Platform Admin navigates to /admin/workspaces/list (listing)
- THEN they see table of all workspaces with member counts and status
- AND action buttons for Edit, Manage Members, Deactivate

#### Scenario: Workspace list pagination and search

- WHEN viewing the workspaces list
- THEN the API supports pagination (page, limit), sorting (name, createdAt), and filtering by status and name/slug

#### Scenario: Members list pagination and search

- WHEN viewing members at /admin/c/:slug/members
- THEN the API supports pagination (page, limit) and search by username/name, with sorting by role and joinedAt

#### Scenario: Workspace member management

- WHEN Platform Admin navigates to /admin/c/:slug/members
- THEN they see all workspace members with global and workspace roles
- AND can add, remove, or change roles for any member

#### Scenario: Add existing user to workspace

- WHEN Platform Admin uses "Add Member" functionality
- THEN they can search existing users by username
- AND assign them to workspace with specific role

#### Scenario: Create new user for workspace

- WHEN Platform Admin uses "Create & Add Member" functionality
- THEN they can create new user and assign to workspace in one flow
- AND specify both global role and workspace role

### Requirement: Admin Layout and Components

The system SHALL provide reusable admin layout and components for consistent admin interface.

#### Scenario: Admin layout structure

- WHEN viewing any admin page
- THEN they see consistent layout with sidebar navigation and header
- AND breadcrumb navigation showing current location

#### Scenario: Admin sidebar navigation

- WHEN viewing admin interface
- THEN sidebar shows expandable sections for Users, Workspaces, Settings
- AND current section is highlighted and expanded

#### Scenario: Admin dashboard widgets

- WHEN viewing admin dashboard
- THEN they see summary cards for users, workspaces, and recent activities
- AND quick action buttons for common admin tasks

### Requirement: Cross-Workspace User Management

The system SHALL allow Platform Admins to manage user workspace memberships across all workspaces.

#### Scenario: View user workspace memberships

- WHEN Platform Admin views user details at /admin/users/:id
- THEN they see all workspace memberships for that user
- AND can see user's role in each workspace

#### Scenario: Add user to multiple workspaces

- WHEN Platform Admin manages user memberships
- THEN they can add the same user to multiple workspaces
- AND assign different roles in each workspace

#### Scenario: Remove user from workspace

- WHEN Platform Admin removes user from workspace
- THEN the user loses access to that workspace
- BUT their global account remains active
