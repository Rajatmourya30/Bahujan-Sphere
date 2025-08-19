
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewSubmissionsTable, type PendingEvent } from './ReviewSubmissionsTable';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function ReviewSubmissionsTab() {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "eventSubmissions"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingEvent));
      setPendingEvents(submissions);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching submissions:", error);
      toast({ title: 'Error', description: 'Could not fetch submissions.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleReview = async (event: PendingEvent, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        // This is a simplified approval process. 
        // A more robust system would involve moving this to a main 'events' collection
        // and potentially creating translation keys.
        // For now, we'll just log it and delete the submission.
        await addDoc(collection(db, "events"), {
          title: event.title,
          date: new Date(event.date), // Assuming event.date is a string that can be parsed
          summary: event.summary,
          readMoreUrl: event.readMoreUrl,
          tags: event.tags,
          createdAt: serverTimestamp(),
        });

        toast({
          title: 'Event Approved',
          description: `"${event.title}" has been added to the main calendar.`,
        });
      }

      // Delete the submission from the pending list for both approve and reject
      await deleteDoc(doc(db, "eventSubmissions", event.id));
      
      if (action === 'reject') {
        toast({
          title: 'Event Rejected',
          description: `"${event.title}" has been rejected and removed from the queue.`,
        });
      }

    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
      toast({
        title: 'Action Failed',
        description: 'An error occurred. Please check the console.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Team Submissions</CardTitle>
          <CardDescription>
            Approve or reject events submitted by team members. Approved events will appear on the public calendar.
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
        <CardTitle>Review Team Submissions</CardTitle>
        <CardDescription>
          Approve or reject events submitted by team members. Approved events will appear on the public calendar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingEvents.length > 0 ? (
            <ReviewSubmissionsTable
                events={pendingEvents}
                onReview={handleReview}
            />
        ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground mt-2">There are no pending submissions to review.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
