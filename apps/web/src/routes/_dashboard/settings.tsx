import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { CreditCard, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/settings')({
  component: SettingsLayout,
});

const settingsNav = [
  {
    title: 'Profile',
    description: 'Update your personal information and avatar',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Security',
    description: 'Password and login preferences',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Billing',
    description: 'View invoices and manage payment methods',
    href: '/settings/billing',
    icon: CreditCard,
    badge: 'Free',
  },
];

function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0">
          <div className="space-y-1">
            <h2 className="px-3 text-lg font-semibold tracking-tight">
              Settings
            </h2>
            <p className="px-3 text-sm text-muted-foreground mb-4">
              Manage your account settings and preferences
            </p>
            <nav className="space-y-1">
              {settingsNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
