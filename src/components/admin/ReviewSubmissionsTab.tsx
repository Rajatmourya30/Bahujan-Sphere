
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ReviewSubmissionsTable, type PendingEvent } from './ReviewSubmissionsTable';

export function ReviewSubmissionsTab() {
  const [submissions, setSubmissions] = useState<PendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "eventSubmissions"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSubmissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingEvent));
      setSubmissions(fetchedSubmissions);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching submissions:", error);
      toast({ title: 'Error', description: 'Could not fetch submissions.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleReview = async (submission: PendingEvent, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const { id, ...liveData } = submission;
        // In a real app, you would move this to a live 'events' collection.
        // For now, we'll log it and delete the submission.
        console.log("Approved Event:", { ...liveData, status: 'approved', approvedAt: new Date() });
        toast({
          title: 'Event Approved',
          description: `"${submission.title}" would now be live.`,
        });
      } else {
        toast({
          title: 'Event Rejected',
          description: `"${submission.title}" has been removed from the queue.`,
        });
      }
      await deleteDoc(doc(db, "eventSubmissions", submission.id));
    } catch (error: any) {
      console.error(`Error ${action}ing event:`, error);
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Submissions</CardTitle>
          <CardDescription>
            Approve or reject events submitted by team members.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Event Submissions</CardTitle>
        <CardDescription>
          Approve or reject events submitted by your team for the Calendar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <ReviewSubmissionsTable events={submissions} onReview={handleReview} />
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground mt-2">There are no pending event submissions to review.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
