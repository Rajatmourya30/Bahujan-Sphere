
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventSubmissionForm } from '@/components/submit/EventSubmissionForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Users, UserCog, HeartHandshake, Library, Store, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkUploadForm } from '@/components/submit/BulkUploadForm';
import { ReviewSubmissionsTab } from '@/components/admin/ReviewSubmissionsTab';

type UserRole = 'Admin' | 'Editor' | 'Reviewer' | 'Contributor' | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    const role = localStorage.getItem('adminUserRole') as UserRole;
    if (authStatus !== 'true' || !role) {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminUserRole');
    router.push('/admin/login');
  };
  
  const permissions = {
      canManageDonations: userRole === 'Admin',
      canManageUsers: userRole === 'Admin',
      canManageTeam: userRole === 'Admin' || userRole === 'Editor',
      canManageContent: userRole === 'Admin' || userRole === 'Editor',
      canSubmit: userRole === 'Admin' || userRole === 'Editor' || userRole === 'Contributor',
      canReview: userRole === 'Admin' || userRole === 'Editor' || userRole === 'Reviewer',
  };

  if (!isAuthenticated || !userRole) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }
  
  const availableTabs = [
    { value: 'single-event', label: 'Submit Single Event', visible: permissions.canSubmit },
    { value: 'bulk-upload', label: 'Submit Bulk Upload', visible: permissions.canSubmit },
    { value: 'review', label: 'Review Submissions', visible: permissions.canReview },
  ].filter(tab => tab.visible);
  
  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : '';


  return (
    <div>
      <header className="mb-8 flex flex-col gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold">{t('admin_dashboard.title')}</h1>
            <p className="text-muted-foreground">Welcome, {userRole}. {t('admin_dashboard.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {permissions.canManageContent && (
              <>
                 <Button asChild variant="outline">
                    <Link href="/admin/calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        Manage Calendar
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/admin/knowledge-hub">
                        <Library className="mr-2 h-4 w-4" />
                        Manage Knowledge Hub
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/admin/store">
                        <Store className="mr-2 h-4 w-4" />
                        Manage Store
                    </Link>
                </Button>
              </>
            )}
            {permissions.canManageDonations && (
                 <Button asChild variant="outline">
                    <Link href="/admin/donations">
                        <HeartHandshake className="mr-2 h-4 w-4" />
                        Donations
                    </Link>
                </Button>
            )}
            {permissions.canManageUsers && (
                <Button asChild variant="outline">
                    <Link href="/admin/users">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                    </Link>
                </Button>
            )}
            {permissions.canManageTeam && (
                <Button asChild variant="outline">
                    <Link href="/admin/team">
                        <UserCog className="mr-2 h-4 w-4" />
                        Manage Team
                    </Link>
                </Button>
            )}
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
      
      <Tabs defaultValue={defaultTab}>
        <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        {permissions.canSubmit && (
            <>
                <TabsContent value="single-event">
                  <EventSubmissionForm />
                </TabsContent>
                <TabsContent value="bulk-upload">
                  <BulkUploadForm />
                </TabsContent>
            </>
        )}
        
        {permissions.canReview && (
            <TabsContent value="review">
                <ReviewSubmissionsTab />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
