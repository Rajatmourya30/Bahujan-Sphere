
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Users, Activity, Bookmark, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { DonationsTrendChart } from '@/components/admin/DonationsTrendChart';

const UserGrowthChart = dynamic(
  () => import('@/components/admin/UserGrowthChart').then((mod) => mod.UserGrowthChart),
  { ssr: false }
);

type UserRole = 'Admin' | 'Editor' | 'Reviewer' | 'Contributor' | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<{name: string} | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    const role = localStorage.getItem('adminUserRole') as UserRole;
    if (authStatus !== 'true' || !role) {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
      const adminEmail = localStorage.getItem('adminUserEmail'); // Assuming email is stored on login
      setUser({ name: role });
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminUserRole');
    localStorage.removeItem('adminUserEmail');
    router.push('/admin/login');
  };
  
  if (!isAuthenticated || !userRole || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8 pt-4">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold">{t('admin_dashboard.title')}</h1>
            <p className="text-muted-foreground">Welcome, {user.name}. Here's an overview of your app.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <Button asChild variant="outline">
                <Link href="/">
                    <Eye className="mr-2 h-4 w-4" />
                    View App
                </Link>
            </Button>
            <Button onClick={handleLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
      </header>
      
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users (DAU)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">+2 since yesterday</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Total of ₹1,950</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <UserGrowthChart />
        <DonationsTrendChart />
      </section>

    </div>
  );
}
