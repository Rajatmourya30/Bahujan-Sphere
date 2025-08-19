
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, writeBatch, serverTimestamp, query, where, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { PendingSubmission } from '@/components/admin/ReviewSubmissionsTable';
import { ReviewSubmissionsTable } from '@/components/admin/ReviewSubmissionsTable';
import { RejectionNoteDialog } from '@/components/admin/RejectionNoteDialog';

interface ReviewKnowledgeHubSubmissionsTabProps {
    currentUser: User | null;
}

export function ReviewKnowledgeHubSubmissionsTab({ currentUser }: ReviewKnowledgeHubSubmissionsTabProps) {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [rejectionDialogState, setRejectionDialogState] = useState<{isOpen: boolean, submission: PendingSubmission | null}>({isOpen: false, submission: null});

  useEffect(() => {
    const q = query(collection(db, "knowledgeHubSubmissions"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSubmissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingSubmission));
      setSubmissions(fetchedSubmissions);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching submissions:", error);
      toast({ title: 'Error', description: 'Could not fetch Knowledge Hub submissions.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const openRejectionDialog = (submission: PendingSubmission) => {
      setRejectionDialogState({isOpen: true, submission: submission});
  }

  const handleReview = async (submission: PendingSubmission, action: 'approve' | 'reject', reason?: string) => {
    if (!currentUser) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }

    const submissionRef = doc(db, "knowledgeHubSubmissions", submission.id);

    try {
      if (action === 'approve') {
        const batch = writeBatch(db);
        const liveDocRef = doc(collection(db, 'knowledgeHub'));
        
        const { id, ...submissionData } = submission;

        batch.set(liveDocRef, {
          ...submissionData,
          status: 'approved',
          approvedBy: currentUser.uid,
          approvedAt: serverTimestamp(),
        });
        batch.delete(submissionRef);

        await batch.commit();
        toast({ title: 'Organization Approved', description: `"${submission.title}" is now live.` });
      } else { // Reject
        if (!reason) {
            toast({ title: 'Reason Required', description: 'Please provide a reason for rejection.', variant: 'destructive' });
            return;
        }
        await updateDoc(submissionRef, {
          status: 'rejected',
          rejectionReason: reason,
          reviewedBy: currentUser.uid,
        });
        toast({ title: 'Organization Rejected', description: `"${submission.title}" has been rejected and feedback has been saved.` });
      }
    } catch (error: any) {
      console.error(`Error ${action}ing organization:`, error);
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    } finally {
        setRejectionDialogState({isOpen: false, submission: null});
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Organization Submissions</CardTitle>
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
            <CardTitle>Review Organization Submissions</CardTitle>
            <CardDescription>Approve or reject organizations submitted by your team.</CardDescription>
        </CardHeader>
        <CardContent>
            {submissions.length > 0 ? (
            <ReviewSubmissionsTable submissions={submissions} onReview={handleReview} openRejectionDialog={openRejectionDialog}/>
            ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground mt-2">There are no pending organization submissions.</p>
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
