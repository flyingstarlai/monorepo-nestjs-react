import { Link, useLocation } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useCurrentWorkspace } from '@/features/workspaces/stores/workspace.store';
import { Home } from 'lucide-react';

export function AppBreadcrumb() {
  const location = useLocation();
  const currentWorkspace = useCurrentWorkspace();

  const getBreadcrumbItems = () => {
    const pathname = location.pathname;

    // Handle workspace routes: /c/:slug/...
    const workspaceMatch = pathname.match(/^\/c\/([^/]+)(.*)$/);
    if (workspaceMatch) {
      const slug = workspaceMatch[1];
      const restPath = workspaceMatch[2];

      // Use workspace name if available, otherwise fallback to slug
      const workspaceLabel = currentWorkspace?.name || slug.toUpperCase();

      if (!restPath || restPath === '/') {
        return [{ label: workspaceLabel, href: null }];
      }

      if (restPath === '/members') {
        return [
          { label: workspaceLabel, href: `/c/${slug}` },
          { label: 'Members', href: null },
        ];
      }

      if (restPath === '/settings') {
        return [
          { label: workspaceLabel, href: `/c/${slug}` },
          { label: 'Settings', href: null },
        ];
      }

      // Generic workspace route
      return [
        { label: workspaceLabel, href: `/c/${slug}` },
        { label: restPath.replace(/^\//, ''), href: null },
      ];
    }

    if (pathname === '/dashboard') {
      return [{ label: 'Dashboard', href: null }];
    }

    if (pathname === '/admin') {
      return [{ label: 'Platform Admin', href: null }];
    }

    // Handle admin workspace routes: /admin/c/:slug/...
    const adminWorkspaceMatch = pathname.match(/^\/admin\/c\/([^/]+)(.*)$/);
    if (adminWorkspaceMatch) {
      const slug = adminWorkspaceMatch[1];
      const restPath = adminWorkspaceMatch[2];

      if (!restPath || restPath === '/') {
        return [
          { label: 'Platform Admin', href: '/admin' },
          { label: `Workspace ${slug}`, href: null },
        ];
      }

      if (restPath === '/users') {
        return [
          { label: 'Platform Admin', href: '/admin' },
          { label: `Workspace ${slug}`, href: `/admin/c/${slug}` },
          { label: 'Members', href: null },
        ];
      }

      // Generic admin workspace route
      return [
        { label: 'Platform Admin', href: '/admin' },
        { label: `Workspace ${slug}`, href: `/admin/c/${slug}` },
        { label: restPath.replace(/^\//, ''), href: null },
      ];
    }

    // Handle account routes: /account/...
    if (pathname.startsWith('/account/')) {
      const accountPath = pathname.replace('/account/', '');

      if (accountPath === 'profile') {
        return [
          { label: 'Account', href: '/account' },
          { label: 'Profile', href: null },
        ];
      }

      if (accountPath === 'security') {
        return [
          { label: 'Account', href: '/account' },
          { label: 'Security', href: null },
        ];
      }

      // Generic account page
      return [{ label: 'Account', href: null }];
    }

    if (pathname === '/account') {
      return [{ label: 'Account', href: null }];
    }

    if (pathname === '/profile') {
      return [{ label: 'Profile', href: null }];
    }

    // Default fallback
    return [{ label: 'Dashboard', href: null }];
  };

  const items = getBreadcrumbItems();

  // Add home breadcrumb if not already at root
  const allItems =
    items.length > 0 && items[0].label !== 'Home'
      ? [{ label: 'Home', href: '/', icon: Home }, ...items]
      : items;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {allItems.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center">
            <BreadcrumbItem className={index === 0 ? 'hidden md:block' : ''}>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href} className="flex items-center gap-1">
                    {'icon' in item && item.icon && (
                      <item.icon className="w-3 h-3" />
                    )}
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1">
                  {'icon' in item && item.icon && (
                    <item.icon className="w-3 h-3" />
                  )}
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < allItems.length - 1 && (
              <BreadcrumbSeparator
                className={index === 0 ? 'hidden md:block' : ''}
              />
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
