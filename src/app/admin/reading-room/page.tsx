
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadingRoomSubmissionForm } from '@/components/admin/ReadingRoomSubmissionForm';
import { ReadingRoomBulkUpload } from '@/components/admin/ReadingRoomBulkUpload';
import { ReviewReadingRoomSubmissionsTab } from '@/components/admin/review/ReviewReadingRoomSubmissionsTab';

export default function ManageReadingRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace('/admin/login');
      } else {
        setUser(currentUser);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [router]);
  
  if (isLoading) {
      return (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Reading Room</h1>
        <p className="text-muted-foreground">Add new documents or review pending submissions.</p>
      </header>
      
      <Tabs defaultValue="single-submit">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single-submit">Submit Single Document</TabsTrigger>
          <TabsTrigger value="bulk-submit">Bulk Upload</TabsTrigger>
          <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="single-submit" className="mt-6">
          <ReadingRoomSubmissionForm />
        </TabsContent>
        <TabsContent value="bulk-submit" className="mt-6">
          <ReadingRoomBulkUpload />
        </TabsContent>
        <TabsContent value="review" className="mt-6">
          <ReviewReadingRoomSubmissionsTab currentUser={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
