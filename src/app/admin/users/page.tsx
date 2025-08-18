
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, Users, Activity, Clock, Percent } from 'lucide-react';
import { UserTable, type UserProfile } from '@/components/admin/UserTable';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { LanguageDemographicsChart } from '@/components/admin/LanguageDemographicsChart';
import { RetentionRateChart } from '@/components/admin/RetentionRateChart';
import { FeatureUsageChart } from '@/components/admin/FeatureUsageChart';
import { DeviceBreakdownChart } from '@/components/admin/DeviceBreakdownChart';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const UserGrowthChart = dynamic(
  () => import('@/components/admin/UserGrowthChart').then((mod) => mod.UserGrowthChart),
  { ssr: false }
);

const UserDemographicsChart = dynamic(
  () => import('@/components/admin/UserDemographicsChart').then((mod) => mod.UserDemographicsChart),
  { ssr: false }
);

export default function UserDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const usersQuery = query(collection(db, "users"), orderBy("name"));
        const unsubscribeFirestore = onSnapshot(usersQuery, (snapshot) => {
          const fetchedUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as UserProfile));
          setUsers(fetchedUsers);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching users:", error);
          toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
          setIsLoading(false);
        });

        return () => unsubscribeFirestore();
      } else {
        router.replace('/admin/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router, toast]);

  const handleDownload = () => {
    // We remove the ID for a cleaner export
    const exportableData = users.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(exportableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_data.xlsx");
  };

  if (isLoading) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold">User Dashboard</h1>
                <p className="text-muted-foreground">Real-time user data from Firestore.</p>
            </div>
            <Button onClick={handleDownload} disabled={users.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export as XLSX
            </Button>
      </header>
      
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
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
                <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">8m 42s</div>
                <p className="text-xs text-muted-foreground">Average session duration</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention (7-Day)</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">42.5%</div>
                <p className="text-xs text-muted-foreground">Users returning after 7 days</p>
            </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <UserGrowthChart />
          <RetentionRateChart />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <UserDemographicsChart />
        <LanguageDemographicsChart />
        <FeatureUsageChart />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DeviceBreakdownChart />
      </section>

      <section>
        <h2 className="font-headline text-2xl font-bold mb-4">All Users</h2>
        <UserTable users={users} />
      </section>
    </div>
  );
}
