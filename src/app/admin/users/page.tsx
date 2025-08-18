
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, Users, Activity, UserPlus, Eye, Bookmark, Clock, Percent, BarChart3, Smartphone } from 'lucide-react';
import { UserTable } from '@/components/admin/UserTable';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { LanguageDemographicsChart } from '@/components/admin/LanguageDemographicsChart';
import { RetentionRateChart } from '@/components/admin/RetentionRateChart';
import { FeatureUsageChart } from '@/components/admin/FeatureUsageChart';
import { DeviceBreakdownChart } from '@/components/admin/DeviceBreakdownChart';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const UserGrowthChart = dynamic(
  () => import('@/components/admin/UserGrowthChart').then((mod) => mod.UserGrowthChart),
  { ssr: false }
);

const UserDemographicsChart = dynamic(
  () => import('@/components/admin/UserDemographicsChart').then((mod) => mod.UserDemographicsChart),
  { ssr: false }
);

const sampleUsers = [
    { id: 1, name: 'Ambedkar Fan', email: 'fan@example.com', country: 'India', state: 'Maharashtra', city: 'Nagpur', birthYear: 1991, createdAt: '2024-05-01T10:00:00Z', lastSeen: '2024-07-20T15:30:00Z', language: 'mr' },
    { id: 2, name: 'Savitri Follower', email: 'savitri@example.com', country: 'India', state: 'Karnataka', city: 'Bengaluru', birthYear: 1985, createdAt: '2024-05-15T12:00:00Z', lastSeen: '2024-07-21T09:00:00Z', language: 'en' },
    { id: 3, name: 'Jyotirao Admirer', email: 'jyotirao@example.com', country: 'USA', state: 'California', city: 'San Francisco', birthYear: 2000, createdAt: '2024-06-01T08:00:00Z', lastSeen: '2024-07-19T22:15:00Z', language: 'en' },
    { id: 4, name: 'Birsa Supporter', email: 'birsa@example.com', country: 'India', state: 'Jharkhand', city: 'Ranchi', birthYear: 1995, createdAt: '2024-06-10T18:00:00Z', lastSeen: '2024-07-21T11:45:00Z', language: 'hi' },
    { id: 5, name: 'Community Member', email: 'member@example.com', country: 'UK', state: 'London', city: 'London', birthYear: 1992, createdAt: '2024-07-01T14:00:00Z', lastSeen: '2024-07-18T18:00:00Z', language: 'en' },
    { id: 6, name: 'New User One', email: 'new1@example.com', country: 'Canada', state: 'Ontario', city: 'Toronto', birthYear: 1998, createdAt: '2024-07-15T11:00:00Z', lastSeen: '2024-07-21T14:00:00Z', language: 'en' },
    { id: 7, name: 'New User Two', email: 'new2@example.com', country: 'India', state: 'Delhi', city: 'New Delhi', birthYear: 2002, createdAt: '2024-07-18T09:30:00Z', lastSeen: '2024-07-20T10:00:00Z', language: 'hi' },
    { id: 8, name: 'Tamil Friend', email: 'tamil@example.com', country: 'India', state: 'Tamil Nadu', city: 'Chennai', birthYear: 1993, createdAt: '2024-07-19T11:30:00Z', lastSeen: '2024-07-21T12:00:00Z', language: 'ta' },
];


export default function UserDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoading(false);
      } else {
        router.replace('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(sampleUsers);
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
                <p className="text-muted-foreground">Global app-wide performance metrics.</p>
            </div>
            <Button onClick={handleDownload}>
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
                <div className="text-2xl font-bold">{sampleUsers.length}</div>
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
        <UserTable users={sampleUsers} />
      </section>
    </div>
  );
}
