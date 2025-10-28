import { Link, useLocation } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function AppBreadcrumb() {
  const location = useLocation();

  const getBreadcrumbItems = () => {
    const pathname = location.pathname;

    // Handle workspace routes: /c/:slug/...
    const workspaceMatch = pathname.match(/^\/c\/([^\/]+)(.*)$/);
    if (workspaceMatch) {
      const slug = workspaceMatch[1];
      const restPath = workspaceMatch[2];

      const capitalizedSlug = slug.toUpperCase();

      if (!restPath || restPath === '/') {
        return [{ label: capitalizedSlug, href: null }];
      }

      if (restPath === '/dashboard') {
        return [
          { label: capitalizedSlug, href: `/c/${slug}` },
          { label: 'Dashboard', href: null },
        ];
      }

      if (restPath === '/members') {
        return [
          { label: capitalizedSlug, href: `/c/${slug}` },
          { label: 'Members', href: null },
        ];
      }

      if (restPath === '/settings') {
        return [
          { label: capitalizedSlug, href: `/c/${slug}` },
          { label: 'Settings', href: null },
        ];
      }

      // Generic workspace route
      return [
        { label: capitalizedSlug, href: `/c/${slug}` },
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
    const adminWorkspaceMatch = pathname.match(/^\/admin\/c\/([^\/]+)(.*)$/);
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

    if (pathname.startsWith('/settings/')) {
      const settingsPath = pathname.replace('/settings/', '');

      if (settingsPath === 'profile') {
        return [
          { label: 'Settings', href: '/settings' },
          { label: 'Profile', href: null },
        ];
      }

      if (settingsPath === 'security') {
        return [
          { label: 'Settings', href: '/settings' },
          { label: 'Security', href: null },
        ];
      }

      if (settingsPath === 'billing') {
        return [
          { label: 'Settings', href: '/settings' },
          { label: 'Billing', href: null },
        ];
      }

      // Generic settings page
      return [{ label: 'Settings', href: null }];
    }

    if (pathname === '/settings') {
      return [{ label: 'Settings', href: '/settings/profile' }];
    }

    if (pathname === '/profile') {
      return [{ label: 'Profile', href: null }];
    }

    // Default fallback
    return [{ label: 'Dashboard', href: null }];
  };

  const items = getBreadcrumbItems();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center">
            <BreadcrumbItem className={index === 0 ? 'hidden md:block' : ''}>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && (
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
