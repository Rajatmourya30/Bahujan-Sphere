
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  FolderKanban,
  HeartHandshake,
  Home,
  Library,
  Megaphone,
  Store,
  UserCog,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
    }
  }, [user, isLoading, pathname, router]);


  // For this simplified example, we'll grant all permissions to any logged-in user.
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
    { href: '/admin/storage', label: 'Storage Explorer', icon: FolderKanban, visible: permissions.canManageContent },
    { href: '/admin/donations', label: 'Donations', icon: HeartHandshake, visible: permissions.canManageDonations },
    { href: '/admin/users', label: 'Users', icon: Users, visible: permissions.canManageUsers },
    { href: '/admin/team', label: 'Team', icon: UserCog, visible: permissions.canManageTeam },
    { href: '/admin/google-ads', label: 'Google Ads', icon: Megaphone, visible: permissions.canManageAds },
  ].filter(item => item.visible);

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
  
  // After loading, if user is not authenticated, render children (which should be the login page due to the redirect)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="pt-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold">Admin Panel</span>
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
    return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
