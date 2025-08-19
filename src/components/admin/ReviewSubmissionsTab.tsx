
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ReviewSubmissionsTable, type PendingSubmission } from './ReviewSubmissionsTable';
import { RejectionNoteDialog } from './RejectionNoteDialog';
import { parse } from 'date-fns';

export function ReviewSubmissionsTab() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [rejectionDialogState, setRejectionDialogState] = useState<{isOpen: boolean, submission: PendingSubmission | null}>({isOpen: false, submission: null});

  useEffect(() => {
    const q = query(collection(db, "eventSubmissions"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSubmissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingSubmission));
      setSubmissions(fetchedSubmissions);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching submissions:", error);
      toast({ title: 'Error', description: 'Could not fetch submissions.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const openRejectionDialog = (submission: PendingSubmission) => {
    setRejectionDialogState({isOpen: true, submission: submission});
  }

  const handleReview = async (submission: PendingSubmission, action: 'approve' | 'reject', reason?: string) => {
    try {
      const submissionRef = doc(db, "eventSubmissions", submission.id);
      
      if (action === 'approve') {
        const batch = writeBatch(db);
        const { id, ...liveData } = submission;
        
        const liveDocRef = doc(collection(db, 'calendarEvents'));
        
        // Ensure submission.date is a string before parsing
        const dateString = submission.date as string;
        if (!dateString || typeof dateString !== 'string') {
          throw new Error('Invalid or missing date in submission.');
        }

        // Convert the date string back to a Date object, then to a Timestamp
        const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
        
        batch.set(liveDocRef, {
            ...liveData,
            date: Timestamp.fromDate(parsedDate), // Use the converted Timestamp
            status: 'approved',
            approvedAt: serverTimestamp(),
        });
        batch.delete(submissionRef);
        
        await batch.commit();
        
        toast({
          title: 'Event Approved',
          description: `"${submission.title}" is now live on the calendar.`,
        });
      } else { // Reject action
        await deleteDoc(submissionRef);
        toast({
          title: 'Event Rejected',
          description: `"${submission.title}" has been removed from the queue.`,
        });
      }
    } catch (error: any) {
      console.error(`Error ${action}ing event:`, error);
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    } finally {
        setRejectionDialogState({isOpen: false, submission: null});
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Event Submissions</CardTitle>
          <CardDescription>
            Approve or reject events submitted by your team for the Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <ReviewSubmissionsTable submissions={submissions} onReview={handleReview} openRejectionDialog={openRejectionDialog} />
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium">All caught up!</h3>
              <p className="text-muted-foreground mt-2">There are no pending event submissions to review.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {rejectionDialogState.isOpen && rejectionDialogState.submission && (
            <RejectionNoteDialog
                submissionTitle={rejectionDialogState.submission.title}
                onConfirm={(reason) => handleReview(rejectionDialogState.submission!, 'reject', reason)}
                onOpenChange={(isOpen) => !isOpen && setRejectionDialogState({isOpen: false, submission: null})}
            />
      )}
    </>
  );
}
