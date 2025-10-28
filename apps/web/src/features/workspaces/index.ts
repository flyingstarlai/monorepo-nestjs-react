export * from './types';
export * from './api/workspaces.api';

// Export store selectors and actions
export {
  useWorkspaceStore,
  useWorkspaces as useWorkspacesStore,
  useCurrentWorkspace,
  useWorkspaceProfile,
  useWorkspaceLoading,
  useWorkspaceErrors,
  useWorkspaceActions,
  useWorkspaceOptimized,
  useWorkspace,
} from './stores/workspace.store';

// Export query hooks with different names to avoid conflicts
export {
  useWorkspaces as useWorkspacesQuery,
  useWorkspaceProfile as useWorkspaceProfileQuery,
  useWorkspaceMembers,
  useWorkspaceActivities,
  useAddWorkspaceMember,
  useUpdateMemberStatus,
  useUpdateMemberRole,
  useWorkspaceStats,
} from './hooks/use-workspaces';

export * from './components/workspace-switcher';
