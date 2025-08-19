
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/lib/books';
import { BookSubmissionForm } from '@/components/admin/submissions/BookSubmissionForm';
import { ReviewBookSubmissionsTab } from '@/components/admin/review/ReviewBookSubmissionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ManageBooksPage() {
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
          <h1 className="font-headline text-3xl font-bold">Manage Books</h1>
          <p className="text-muted-foreground">Submit new books or review pending submissions.</p>
      </header>
      
      <Tabs defaultValue="submit">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit">Submit New Book</TabsTrigger>
            <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="mt-6">
            <BookSubmissionForm />
        </TabsContent>
         <TabsContent value="review" className="mt-6">
            <ReviewBookSubmissionsTab currentUser={user} />
        </TabsContent>
      </Tabs>

    </div>
  );
}
