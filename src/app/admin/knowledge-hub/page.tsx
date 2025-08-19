
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { KnowledgeHubSubmissionForm } from '@/components/admin/submissions/KnowledgeHubSubmissionForm';
import { ReviewKnowledgeHubSubmissionsTab } from '@/components/admin/review/ReviewKnowledgeHubSubmissionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ManageKnowledgeHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
          <h1 className="font-headline text-3xl font-bold">Manage Knowledge Hub</h1>
          <p className="text-muted-foreground">Submit new organizations or review pending submissions.</p>
      </header>

      <Tabs defaultValue="submit">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit">Submit New Organization</TabsTrigger>
            <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="mt-6">
            <KnowledgeHubSubmissionForm />
        </TabsContent>
         <TabsContent value="review" className="mt-6">
            <ReviewKnowledgeHubSubmissionsTab currentUser={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
