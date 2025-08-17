
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TeamMemberTable } from '@/components/admin/TeamMemberTable';

const sampleTeamMembers = [
    { id: 1, name: 'Admin User', email: 'admin@bahujansphere.com', role: 'Admin', joinedAt: '2024-01-15T10:00:00Z' },
    { id: 2, name: 'Content Editor', email: 'editor@bahujansphere.com', role: 'Editor', joinedAt: '2024-02-20T11:30:00Z' },
    { id: 3, name: 'Community Contributor', email: 'contributor1@example.com', role: 'Contributor', joinedAt: '2024-05-10T18:00:00Z' },
    { id: 4, name: 'Another Contributor', email: 'contributor2@example.com', role: 'Contributor', joinedAt: '2024-06-01T09:00:00Z' },
];


export default function TeamManagementPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);


  if (!isAuthenticated) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <Button asChild variant="ghost" className="mb-2 -ml-4">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold">Team Management</h1>
                <p className="text-muted-foreground">Invite and manage your team members.</p>
            </div>
      </header>
      
      <section>
        <TeamMemberTable members={sampleTeamMembers} />
      </section>
    </div>
  );
}
