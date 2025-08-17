'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventSubmissionForm } from '@/components/submit/EventSubmissionForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/hooks/use-language';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for our simulated auth token in localStorage.
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    // Show a loading state while we check authentication.
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold">{t('admin_dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('admin_dashboard.description')}</p>
      </header>
      <EventSubmissionForm />
    </div>
  );
}
