import { Link, useLocation } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function NavMain({
  items,
  title,
  isLoading = false,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    isSubmenu?: boolean;
    subItems?: {
      title: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
  title?: string;
  isLoading?: boolean;
}) {
  const location = useLocation();
  
  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{title || 'Platform'}</SidebarGroupLabel>
        <SidebarMenu>
          {[...Array(3)].map((_, index) => (
            <SidebarMenuItem key={`skeleton-${index}`}>
              <SidebarMenuButton disabled className="opacity-50">
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <span className="w-16 h-4 bg-muted rounded animate-pulse" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title || 'Platform'}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.isSubmenu && item.subItems ? (
              <SidebarMenuSub>
                <SidebarMenuSubButton isActive={item.isActive}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuSubButton>
                {item.subItems.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={subItem.url === location.pathname}
                    >
                      <Link to={subItem.url}>
                        {subItem.icon && <subItem.icon />}
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            ) : (
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={item.isActive}
                className={cn(
                  "transition-all duration-200",
                  "hover:bg-accent/50",
                  "data-[active=true]:bg-accent"
                )}
              >
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
