import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { User, Settings, CreditCard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_dashboard/settings/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: SettingsLayout,
});

function SettingsLayout() {
  const navigate = useNavigate({ from: '/settings' });
  const location = useLocation();

  // If accessing the index route directly (no sub-route), redirect to profile
  if (location.pathname === '/settings/' || location.pathname === '/settings') {
    navigate({ to: '/settings/profile', replace: true });
    return null;
  }

  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/settings/profile',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      path: '/settings/billing',
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      path: '/settings/security',
    },
  ];

  const activeTab = settingsTabs.find(
    (tab) =>
      location.pathname === tab.path ||
      (tab.path === '/settings/profile' && location.pathname === '/settings')
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:w-64">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <nav className="space-y-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab?.id === tab.id;

                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => navigate({ to: tab.path })}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
