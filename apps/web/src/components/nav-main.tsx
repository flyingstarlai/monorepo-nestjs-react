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

export function NavMain({
  items,
  title,
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
}) {
  const location = useLocation();
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
                    <SidebarMenuButton asChild isActive={subItem.url === location.pathname}>
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
