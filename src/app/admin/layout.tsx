
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
  Book,
  BookOpenCheck,
  Calendar,
  HeartHandshake,
  Home,
  Library,
  Megaphone,
  Store,
  UserCog,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAdminAuth();

  // For this simplified example, we'll grant all permissions to any logged-in user.
  // A real app would use custom claims to manage roles.
  const permissions = {
    canManageDonations: true,
    canManageUsers: true,
    canManageTeam: true,
    canManageContent: true,
    canAccessCalendar: true,
    canManageAds: true,
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home, visible: true },
    { href: '/admin/calendar', label: 'Calendar', icon: Calendar, visible: permissions.canAccessCalendar },
    { href: '/admin/knowledge-hub', label: 'Knowledge Hub', icon: Library, visible: permissions.canManageContent },
    { href: '/admin/store', label: 'Store Directory', icon: Store, visible: permissions.canManageContent },
    { href: '/admin/books', label: 'Books', icon: Book, visible: permissions.canManageContent },
    { href: '/admin/reading-room', label: 'Reading Room', icon: BookOpenCheck, visible: permissions.canManageContent },
    { href: '/admin/donations', label: 'Donations', icon: HeartHandshake, visible: permissions.canManageDonations },
    { href: '/admin/users', label: 'Users', icon: Users, visible: permissions.canManageUsers },
    { href: '/admin/team', label: 'Team', icon: UserCog, visible: permissions.canManageTeam },
    { href: '/admin/google-ads', label: 'Google Ads', icon: Megaphone, visible: permissions.canManageAds },
  ].filter(item => item.visible);

  // Render loading skeleton while auth state is being determined
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  // Do not render layout on login page to avoid sidebar appearing
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If loading is finished and there's no user, children will be the login page
  // The provider will have already initiated the redirect.
  if (!user) {
      return <>{children}</>;
  }


  return (
    <SidebarProvider defaultOpen={false}>
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
            <SidebarTrigger />
        </header>
        <main className="p-4 sm:px-6 sm:py-0 space-y-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <AdminAuthProvider>
            <AdminDashboardLayout>{children}</AdminDashboardLayout>
        </AdminAuthProvider>
    )
}
