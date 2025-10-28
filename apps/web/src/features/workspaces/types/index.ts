export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  role: WorkspaceRole;
  isActive: boolean;
  joinedAt: string;
}

export interface WorkspaceMembership {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum WorkspaceRole {
  OWNER = 'Owner',
  AUTHOR = 'Author',
  MEMBER = 'Member',
}

export interface WorkspaceProfile {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  globalRole: string;
  workspaceRole: WorkspaceRole;
  workspaceId: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface WorkspacesResponse {
  items: WorkspaceMembership[];
}
