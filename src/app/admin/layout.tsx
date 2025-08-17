
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Calendar,
  HeartHandshake,
  Home,
  Library,
  Store,
  UserCog,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { useEffect, useState } from 'react';

type UserRole = 'Admin' | 'Editor' | 'Reviewer' | 'Contributor' | null;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const role = localStorage.getItem('adminUserRole') as UserRole;
    setUserRole(role);
  }, [pathname]);

  const permissions = {
    canManageDonations: userRole === 'Admin',
    canManageUsers: userRole === 'Admin',
    canManageTeam: userRole === 'Admin' || userRole === 'Editor',
    canManageContent: userRole === 'Admin' || userRole === 'Editor',
    canAccessCalendar: userRole === 'Admin' || userRole === 'Editor' || userRole === 'Contributor' || userRole === 'Reviewer',
  };
  
  const navItems = [
      { href: '/admin', label: 'Dashboard', icon: Home, visible: true },
      { href: '/admin/calendar', label: 'Calendar', icon: Calendar, visible: permissions.canAccessCalendar },
      { href: '/admin/knowledge-hub', label: 'Knowledge Hub', icon: Library, visible: permissions.canManageContent },
      { href: '/admin/store', label: 'Store Directory', icon: Store, visible: permissions.canManageContent },
      { href: '/admin/donations', label: 'Donations', icon: HeartHandshake, visible: permissions.canManageDonations },
      { href: '/admin/users', label: 'Users', icon: Users, visible: permissions.canManageUsers },
      { href: '/admin/team', label: 'Team', icon: UserCog, visible: permissions.canManageTeam },
  ].filter(item => item.visible);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="pt-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="md:hidden" />
        </header>
        <main className="p-4 sm:px-6 sm:py-0 space-y-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
