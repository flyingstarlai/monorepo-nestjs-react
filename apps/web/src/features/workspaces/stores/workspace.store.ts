import { create } from 'zustand';
import type { WorkspaceMembership, WorkspaceProfile } from '../types';
import { WorkspaceRole } from '../types';
import { workspacesApi } from '../api/workspaces.api';

interface WorkspaceStore {
  // State
  workspaces: WorkspaceMembership[];
  currentWorkspace: WorkspaceMembership | null;
  workspaceProfile: WorkspaceProfile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isSwitchingWorkspace: boolean;
  error: Error | null;
  profileError: Error | null;

  // Actions
  setWorkspaces: (workspaces: WorkspaceMembership[]) => void;
  setCurrentWorkspace: (workspace: WorkspaceMembership | null) => void;
  setWorkspaceProfile: (profile: WorkspaceProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setProfileLoading: (loading: boolean) => void;
  setSwitchingWorkspace: (switching: boolean) => void;
  setError: (error: Error | null) => void;
  setProfileError: (error: Error | null) => void;

  // Async actions
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceProfile: (slug: string) => Promise<void>;
  switchWorkspace: (workspace: WorkspaceMembership) => Promise<void>;
  refreshWorkspaceProfile: () => Promise<void>;
  refetchWorkspaces: () => Promise<void>;

  // Computed values
  canManageWorkspace: () => boolean;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  // Initial state
  workspaces: [],
  currentWorkspace: null,
  workspaceProfile: null,
  isLoading: false,
  isProfileLoading: false,
  isSwitchingWorkspace: false,
  error: null,
  profileError: null,

  // Setters
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setWorkspaceProfile: (profile) => set({ workspaceProfile: profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setProfileLoading: (isProfileLoading) => set({ isProfileLoading }),
  setSwitchingWorkspace: (isSwitchingWorkspace) => set({ isSwitchingWorkspace }),
  setError: (error) => set({ error }),
  setProfileError: (profileError) => set({ profileError }),

  // Async actions
  fetchWorkspaces: async () => {
    const state = get();
    if (state.isLoading) return; // Prevent multiple simultaneous calls

    try {
      set({ isLoading: true, error: null });

      const data = await workspacesApi.getWorkspaces();
      const workspaces = data.items || [];
      set({ workspaces });

      // Set current workspace if not already set
      const currentState = get();
      if (!currentState.currentWorkspace && workspaces.length > 0) {
        const currentSlug =
          window.location.pathname.match(/^\/c\/([^/]+)/)?.[1];
        const urlWorkspace = workspaces.find((ws) => ws.slug === currentSlug);
        set({ currentWorkspace: urlWorkspace || workspaces[0] });
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      set({
        error:
          error instanceof Error
            ? error
            : new Error('Failed to fetch workspaces'),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWorkspaceProfile: async (slug) => {
    const state = get();
    if (state.isProfileLoading) return; // Prevent multiple simultaneous calls

    try {
      set({ isProfileLoading: true, profileError: null });

      const profile = await workspacesApi.getWorkspaceProfile(slug);
      set({ workspaceProfile: profile });
    } catch (error) {
      set({
        profileError:
          error instanceof Error
            ? error
            : new Error('Failed to fetch workspace profile'),
      });
    } finally {
      set({ isProfileLoading: false });
    }
  },

  switchWorkspace: async (workspace) => {
    try {
      set({ isSwitchingWorkspace: true, currentWorkspace: workspace });
      await get().fetchWorkspaceProfile(workspace.slug);

      // Navigate to new workspace
      // Note: This will be handled by the component that calls switchWorkspace
      // The navigation should be done at the component level using TanStack Router
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      // Don't throw error to prevent UI from breaking
      set({
        error:
          error instanceof Error
            ? error
            : new Error('Failed to switch workspace'),
      });
    } finally {
      set({ isSwitchingWorkspace: false });
    }
  },

  refreshWorkspaceProfile: async () => {
    const currentWorkspace = get().currentWorkspace;
    if (!currentWorkspace) return;

    await get().fetchWorkspaceProfile(currentWorkspace.slug);
  },

  refetchWorkspaces: async () => {
    await get().fetchWorkspaces();
  },

  // Computed values
  canManageWorkspace: () => {
    const { workspaceProfile } = get();
    if (!workspaceProfile) return false;
    return [WorkspaceRole.OWNER].includes(workspaceProfile.workspaceRole);
  },
}));

// Selectors for optimized re-renders
export const useWorkspaces = () =>
  useWorkspaceStore((state) => state.workspaces);
export const useCurrentWorkspace = () =>
  useWorkspaceStore((state) => state.currentWorkspace);
export const useWorkspaceProfile = () =>
  useWorkspaceStore((state) => state.workspaceProfile);
export const useIsLoading = () => useWorkspaceStore((state) => state.isLoading);
export const useIsProfileLoading = () => useWorkspaceStore((state) => state.isProfileLoading);
export const useIsSwitchingWorkspace = () => useWorkspaceStore((state) => state.isSwitchingWorkspace);

// Combined loading hook for convenience
export const useWorkspaceLoading = () => {
  const isLoading = useIsLoading();
  const isProfileLoading = useIsProfileLoading();
  const isSwitchingWorkspace = useIsSwitchingWorkspace();
  
  return {
    isLoading,
    isProfileLoading,
    isSwitchingWorkspace,
  };
};
export const useWorkspaceErrors = () =>
  useWorkspaceStore((state) => ({
    error: state.error,
    profileError: state.profileError,
  }));

// Action selectors for stable references - use getState to avoid unstable references
export const useWorkspaceActions = () => ({
  fetchWorkspaces: () => useWorkspaceStore.getState().fetchWorkspaces(),
  switchWorkspace: (workspace: WorkspaceMembership) => useWorkspaceStore.getState().switchWorkspace(workspace),
  refreshWorkspaceProfile: () => useWorkspaceStore.getState().refreshWorkspaceProfile(),
  refetchWorkspaces: () => useWorkspaceStore.getState().refetchWorkspaces(),
  fetchWorkspaceProfile: (slug: string) => useWorkspaceStore.getState().fetchWorkspaceProfile(slug),
});

// Combined hook for backward compatibility - uses individual selectors to prevent infinite loops
export function useWorkspaceOptimized() {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceProfile = useWorkspaceStore((state) => state.workspaceProfile);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const isProfileLoading = useWorkspaceStore((state) => state.isProfileLoading);
  const isSwitchingWorkspace = useWorkspaceStore((state) => state.isSwitchingWorkspace);
  const error = useWorkspaceStore((state) => state.error);
  const profileError = useWorkspaceStore((state) => state.profileError);
  
  // Use getState for stable function references
  const store = useWorkspaceStore.getState();

  return {
    workspaces,
    currentWorkspace,
    workspaceProfile,
    isLoading,
    isProfileLoading,
    isSwitchingWorkspace,
    error,
    profileError,
    switchWorkspace: store.switchWorkspace,
    refreshWorkspaceProfile: store.refreshWorkspaceProfile,
    refetchWorkspaces: store.refetchWorkspaces,
    fetchWorkspaces: store.fetchWorkspaces,
    fetchWorkspaceProfile: store.fetchWorkspaceProfile,
    canManageWorkspace: store.canManageWorkspace(),
  };
}

// Backward compatibility export
export function useWorkspace() {
  return useWorkspaceOptimized();
}
