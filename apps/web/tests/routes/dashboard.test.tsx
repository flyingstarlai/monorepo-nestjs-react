import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import * as activitiesHooks from '../../src/features/activities';
import * as authHooks from '../../src/features/auth';
import { DashboardRedirect } from '../../src/routes/_dashboard/dashboard';

// Mock the route component
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => ({
    component: DashboardRedirect,
  }),
}));

// Mock auth hook
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  name: 'Test User',
  role: 'User',
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  avatar: null,
};

vi.mock('../../src/features/auth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock activities hook
const mockActivitiesData = {
  items: [
    {
      id: 'activity-1',
      type: 'login_success',
      message: 'Successfully logged in',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'activity-2',
      type: 'profile_updated',
      message: 'Profile updated successfully',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  nextCursor: undefined,
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('DashboardComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
    expect(screen.getAllByRole('generic', { name: '' })).toHaveLength(
      expect.any(Number)
    );
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders activities when data is available', async () => {
    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: mockActivitiesData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    await waitFor(() => {
      expect(screen.getByText('Successfully logged in')).toBeInTheDocument();
      expect(
        screen.getByText('Profile updated successfully')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(
      screen.getByText('Your latest account activities')
    ).toBeInTheDocument();
  });

  it('renders empty state when no activities', () => {
    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: { items: [], nextCursor: undefined },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    expect(screen.getByText('No recent activities')).toBeInTheDocument();
    expect(
      screen.getByText('Your activities will appear here as you use the app')
    ).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    expect(
      screen.getByText('Failed to load recent activities')
    ).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', () => {
    const mockRefetch = vi.fn();
    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    renderWithProviders(<DashboardRedirect />);

    const retryButton = screen.getByText('Retry');
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('displays user information correctly', () => {
    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: { items: [], nextCursor: undefined },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows admin panel for admin users', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: { ...mockUser, role: 'Admin' },
    } as any);

    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: { items: [], nextCursor: undefined },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('formats relative time correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoDaysAgo = new Date(now.getTime() - 172800000);

    const activitiesWithDifferentTimes = {
      items: [
        {
          id: 'activity-1',
          type: 'login_success',
          message: 'Recent activity',
          createdAt: oneHourAgo.toISOString(),
        },
        {
          id: 'activity-2',
          type: 'profile_updated',
          message: 'Older activity',
          createdAt: twoDaysAgo.toISOString(),
        },
      ],
      nextCursor: undefined,
    };

    vi.spyOn(activitiesHooks, 'useRecentActivities').mockReturnValue({
      data: activitiesWithDifferentTimes,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<DashboardRedirect />);

    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });
});
