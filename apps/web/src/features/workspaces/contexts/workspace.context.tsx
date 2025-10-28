import { createContext, useContext, useReducer, useEffect } from 'react';
import type { WorkspaceMembership, WorkspaceProfile } from '../types';
import { WorkspaceRole } from '../types';
import { workspacesApi } from '../api/workspaces.api';

interface WorkspaceState {
  workspaces: WorkspaceMembership[];
  currentWorkspace: WorkspaceMembership | null;
  workspaceProfile: WorkspaceProfile | null;
  isLoading: boolean;
  error: string | null;
}

type WorkspaceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKSPACES'; payload: WorkspaceMembership[] }
  | { type: 'SET_CURRENT_WORKSPACE'; payload: WorkspaceMembership | null }
  | { type: 'SET_WORKSPACE_PROFILE'; payload: WorkspaceProfile | null }
  | { type: 'UPDATE_WORKSPACE_MEMBER'; payload: WorkspaceMembership };

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  workspaceProfile: null,
  isLoading: false,
  error: null,
};

function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_WORKSPACES':
      return {
        ...state,
        workspaces: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_CURRENT_WORKSPACE':
      return {
        ...state,
        currentWorkspace: action.payload,
        workspaceProfile: null, // Clear profile when switching workspaces
      };
    case 'SET_WORKSPACE_PROFILE':
      return { ...state, workspaceProfile: action.payload };
    case 'UPDATE_WORKSPACE_MEMBER':
      return {
        ...state,
        workspaces: state.workspaces.map((ws) =>
          ws.id === action.payload.id ? action.payload : ws
        ),
        currentWorkspace:
          state.currentWorkspace?.id === action.payload.id
            ? action.payload
            : state.currentWorkspace,
      };
    default:
      return state;
  }
}

export interface WorkspaceContextType extends WorkspaceState {
  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (workspace: WorkspaceMembership) => Promise<void>;
  refreshWorkspaceProfile: () => Promise<void>;
  canManageWorkspace: () => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  const loadWorkspaces = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await workspacesApi.getWorkspaces();
      dispatch({ type: 'SET_WORKSPACES', payload: response.items });

      // Auto-select first workspace if none selected
      if (!state.currentWorkspace && response.items.length > 0) {
        const firstWorkspace = response.items[0];
        dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: firstWorkspace });

        // Load workspace profile
        try {
          const profile = await workspacesApi.getWorkspaceProfile(
            firstWorkspace.slug
          );
          dispatch({ type: 'SET_WORKSPACE_PROFILE', payload: profile });
        } catch (error) {
          console.error('Failed to load workspace profile:', error);
        }
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to load workspaces',
      });
    }
  };

  const switchWorkspace = async (workspace: WorkspaceMembership) => {
    try {
      dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: workspace });

      // Load new workspace profile
      const profile = await workspacesApi.getWorkspaceProfile(workspace.slug);
      dispatch({ type: 'SET_WORKSPACE_PROFILE', payload: profile });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to switch workspace',
      });
    }
  };

  const refreshWorkspaceProfile = async () => {
    if (!state.currentWorkspace) return;

    try {
      const profile = await workspacesApi.getWorkspaceProfile(
        state.currentWorkspace.slug
      );
      dispatch({ type: 'SET_WORKSPACE_PROFILE', payload: profile });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error
            ? error.message
            : 'Failed to refresh workspace profile',
      });
    }
  };

  const canManageWorkspace = () => {
    if (!state.workspaceProfile) return false;
    return [WorkspaceRole.OWNER].includes(state.workspaceProfile.workspaceRole);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const value: WorkspaceContextType = {
    ...state,
    loadWorkspaces,
    switchWorkspace,
    refreshWorkspaceProfile,
    canManageWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
