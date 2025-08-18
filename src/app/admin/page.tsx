
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Users, Activity, Clock, Percent, Calendar, CheckCircle, BarChart, Share2, Store, ExternalLink, MousePointerClick, TrendingUp, Heart, Repeat, UserCheck, Banknote, Library, BarChart3, Presentation, DollarSign, Target, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { DonationsTrendChart } from '@/components/admin/DonationsTrendChart';
import { LanguageDemographicsChart } from '@/components/admin/LanguageDemographicsChart';
import { RetentionRateChart } from '@/components/admin/RetentionRateChart';
import { FeatureUsageChart } from '@/components/admin/FeatureUsageChart';
import { DeviceBreakdownChart } from '@/components/admin/DeviceBreakdownChart';
import { EventsAddedChart } from '@/components/admin/EventsAddedChart';
import { TopEventsTable } from '@/components/admin/TopEventsTable';
import { EventEngagementByLanguageChart } from '@/components/admin/EventEngagementByLanguageChart';
import { TopStoresTable } from '@/components/admin/TopStoresTable';
import { StoreCategoryChart } from '@/components/admin/StoreCategoryChart';
import { TopDonorLocationsChart } from '@/components/admin/TopDonorLocationsChart';
import { TopOrgsTable } from '@/components/admin/TopOrgsTable';
import { KnowledgeHubEngagementChart } from '@/components/admin/KnowledgeHubEngagementChart';
import { AdRevenueChart } from '@/components/admin/AdRevenueChart';
import { RevenueByCategoryChart } from '@/components/admin/RevenueByCategoryChart';
import { TopAdPlacementsChart } from '@/components/admin/TopAdPlacementsChart';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


const UserGrowthChart = dynamic(
  () => import('@/components/admin/UserGrowthChart').then((mod) => mod.UserGrowthChart),
  { ssr: false }
);

const UserDemographicsChart = dynamic(
  () => import('@/components/admin/UserDemographicsChart').then((mod) => mod.UserDemographicsChart),
  { ssr: false }
);


type UserRole = 'Admin' | 'Editor' | 'Reviewer' | 'Contributor' | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        
        const teamQuery = query(collection(db, "teamMembers"), where("email", "==", user.email));
        const querySnapshot = await getDocs(teamQuery);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data();
          const role = userDoc.role as UserRole;
          setUserRole(role);
          localStorage.setItem('adminUserRole', role || '');
        } else {
          setUserRole(null);
          localStorage.removeItem('adminUserRole');
        }

      } else {
        router.replace('/admin/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminUserRole');
        router.push('/admin/login');
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };
  
  if (isLoading || !firebaseUser) {
    return (
        <div className="space-y-4 pt-4">
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
            <p className="text-muted-foreground">Welcome, {userRole || 'User'}. Here's an overview of your app.</p>
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
      
      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-bold border-b pb-2">Global App Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <UserGrowthChart />
            <RetentionRateChart />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <UserDemographicsChart />
            <LanguageDemographicsChart />
            <FeatureUsageChart />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <DonationsTrendChart />
            <DeviceBreakdownChart />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-bold border-b pb-2">Calendar Analytics</h2>
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">128</div>
                    <p className="text-xs text-muted-foreground">4 upcoming this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Event Views</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">14,289</div>
                    <p className="text-xs text-muted-foreground">+12% this week</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">845</div>
                    <p className="text-xs text-muted-foreground">From social buttons</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <EventsAddedChart />
            <TopEventsTable />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <EventEngagementByLanguageChart />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-bold border-b pb-2">Bahujan Store Analytics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">Stores listed in directory</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total External Clicks</CardTitle>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4,892</div>
                    <p className="text-xs text-muted-foreground">+8% this week</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4.65%</div>
                    <p className="text-xs text-muted-foreground">Click-Through Rate</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">32.1%</div>
                    <p className="text-xs text-muted-foreground">After clicking external link</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <TopStoresTable />
            <StoreCategoryChart />
        </div>
      </section>
      
      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-bold border-b pb-2">Knowledge Hub Analytics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                    <Library className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">Organizations listed</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">External Clicks</CardTitle>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2,140</div>
                    <p className="text-xs text-muted-foreground">+5% this week</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Viewed Org</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">Samata Sainik Dal</div>
                    <p className="text-xs text-muted-foreground">480 views this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">489</div>
                    <p className="text-xs text-muted-foreground">Across all organizations</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <TopOrgsTable />
            <KnowledgeHubEngagementChart />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-bold border-b pb-2">Donations Analytics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹10,850</div>
                    <p className="text-xs text-muted-foreground">From 5 donations</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹2,170</div>
                    <p className="text-xs text-muted-foreground">Per contribution</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2.4%</div>
                    <p className="text-xs text-muted-foreground">From users who see the option</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Repeat Donors</CardTitle>
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">20%</div>
                    <p className="text-xs text-muted-foreground">Percentage of repeat donors</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <DonationsTrendChart />
            <TopDonorLocationsChart />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-bold border-b pb-2">Google Ads Analytics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ad Impressions</CardTitle>
                    <Presentation className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2,458,234</div>
                    <p className="text-xs text-muted-foreground">Across all categories</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ad Revenue (Month)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹42,500</div>
                    <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Ad CTR</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">1.85%</div>
                    <p className="text-xs text-muted-foreground">Click-Through Rate</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">eCPM</CardTitle>
                    <Radio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹17.29</div>
                    <p className="text-xs text-muted-foreground">Effective cost per mille</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <AdRevenueChart />
            <RevenueByCategoryChart />
            <TopAdPlacementsChart />
        </div>
      </section>

    </div>
  );
}
