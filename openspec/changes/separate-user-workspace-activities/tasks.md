## 1. Backend Implementation

### Database Schema
- [ ] 1.1 Update Activity entity with scope field and migration
- [ ] 1.2 Add database migration for existing activity records
- [ ] 1.3 Test migration and verify data integrity

### Activities Service
- [ ] 1.4 Update ActivitiesService with scope parameter support
- [ ] 1.5 Implement findByWorkspace() method for workspace-scoped activities
- [ ] 1.6 Modify findByOwner() to filter by user scope only
- [ ] 1.7 Update findByWorkspaceAndOwner() to use both filters
- [ ] 1.8 Add comprehensive error handling and logging

### API Controllers
- [ ] 1.9 Update Activities controller to use new scoped methods
- [ ] 2.0 Add workspace activity recording endpoints to WorkspaceActivities controller
- [ ] 2.1 Update user profile update to record user-scoped activities
- [ ] 2.2 Add workspace member management activity recording
- [ ] 2.3 Add workspace settings update activity recording

### Backend Testing
- [ ] 2.4 Write integration tests for activity scoping
- [ ] 2.5 Test user activity recording flows
- [ ] 2.6 Test workspace activity recording flows
- [ ] 2.7 Verify activity separation and data consistency

## 2. Frontend Implementation

### Activity Hooks
- [ ] 2.8 Create useUserActivities() hook for global user activities
- [ ] 2.9 Create useWorkspaceActivities() hook for workspace-specific activities
- [ ] 3.0 Update existing useRecentActivities() to use appropriate hook based on context
- [ ] 3.1 Add proper TypeScript types for new activity scopes

### UI Components
- [ ] 3.2 Update Dashboard component to use user activities
- [ ] 3.3 Update Activities page to use workspace activities
- [ ] 3.4 Add activity type icons and descriptions for new workspace activities
- [ ] 3.5 Implement loading states and error handling for both hooks

### Frontend Integration
- [ ] 3.6 Update activities API client to support both endpoints
- [ ] 3.7 Update activity type definitions and enums
- [ ] 3.8 Add navigation context awareness for appropriate hook selection
- [ ] 3.9 Update exports and index files

## 3. Testing & Validation

### End-to-End Testing
- [ ] 4.1 Test user login activity recording and display
- [ ] 4.2 Test profile update activity recording and display
- [ ] 4.3 Test password change activity recording and display
- [ ] 4.4 Test workspace member addition activity recording and display
- [ ] 4.5 Test workspace settings update activity recording and display

### Integration Testing
- [ ] 4.6 Test dashboard shows user activities correctly
- [ ] 4.7 Test activities page shows workspace activities correctly
- [ ] 4.8 Test activity pagination and cursor navigation
- [ ] 4.9 Verify no cross-contamination between user and workspace activities

### Performance Testing
- [ ] 5.0 Test activity recording performance with high volume
- [ ] 5.1 Test database query performance with activity filters
- [ ] 5.2 Test frontend rendering performance with large activity lists

## 4. Documentation & Deployment

### Documentation
- [ ] 6.1 Update API documentation for activity scoping
- [ ] 6.2 Document activity types and when to use each scope
- [ ] 6.3 Update frontend component documentation
- [ ] 6.4 Create migration guide for existing activity data

### Deployment Readiness
- [ ] 6.5 Verify all tests pass in development environment
- [ ] 6.6 Test database migration in staging environment
- [ ] 6.7 Prepare rollback plan for any issues
- [ ] 6.8 Update feature flags for gradual rollout if needed
