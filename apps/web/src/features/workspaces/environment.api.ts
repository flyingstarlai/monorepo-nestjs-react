import { apiClient } from '@/lib/api-client';
import { WorkspaceError } from '@/lib/api-errors';

export interface Environment {
  id: string;
  host: string;
  port: number;
  username: string;
  database: string;
  connectionTimeout?: number;

  connectionStatus: string;
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnvironmentDto {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionTimeout?: number;

}

export interface UpdateEnvironmentDto {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionTimeout?: number;

}

export interface TestConnectionDto {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionTimeout?: number;

}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  error?: string;
}

export const environmentApi = {
  // Get environment configuration
  async getEnvironment(slug: string): Promise<{ environment: Environment | null }> {
    try {
      const response = await apiClient.get<{ environment: Environment | null }>(`/c/${slug}/environment`);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to fetch environment configuration');
    }
  },

  // Create environment configuration
  async createEnvironment(slug: string, payload: CreateEnvironmentDto): Promise<{ environment: Environment }> {
    try {
      const response = await apiClient.post<{ environment: Environment }>(`/c/${slug}/environment`, payload);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError(
        error instanceof Error ? error.message : 'Failed to create environment configuration'
      );
    }
  },

  // Update environment configuration
  async updateEnvironment(slug: string, payload: UpdateEnvironmentDto): Promise<{ environment: Environment }> {
    try {
      const response = await apiClient.put<{ environment: Environment }>(`/c/${slug}/environment`, payload);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError(
        error instanceof Error ? error.message : 'Failed to update environment configuration'
      );
    }
  },

  // Delete environment configuration
  async deleteEnvironment(slug: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/c/${slug}/environment`);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to delete environment configuration');
    }
  },

  // Test environment connection
  async testConnection(slug: string, payload: TestConnectionDto): Promise<TestConnectionResult> {
    try {
      const response = await apiClient.post<TestConnectionResult>(`/c/${slug}/environment/test`, payload);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to test environment connection');
    }
  },
};