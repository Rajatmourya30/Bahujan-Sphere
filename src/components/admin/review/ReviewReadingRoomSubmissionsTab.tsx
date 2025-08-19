
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, getMetadata } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { PendingSubmission } from '@/components/admin/ReviewSubmissionsTable';
import { RejectionNoteDialog } from '@/components/admin/RejectionNoteDialog';
import { ReviewReadingRoomSubmissionsTable } from './ReviewReadingRoomSubmissionsTable';


// Define a more specific type for Reading Room submissions
export interface PendingReadingRoomItem extends PendingSubmission {
    author: string;
    description: string;
    url: string;
    storagePath: string;
    coverImageUrl: string;
    coverImageStoragePath: string;
}

interface ReviewReadingRoomSubmissionsTabProps {
    currentUser: User | null;
}

export function ReviewReadingRoomSubmissionsTab({ currentUser }: ReviewReadingRoomSubmissionsTabProps) {
  const [submissions, setSubmissions] = useState<PendingReadingRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [rejectionDialogState, setRejectionDialogState] = useState<{isOpen: boolean, submission: PendingSubmission | null}>({isOpen: false, submission: null});

  useEffect(() => {
    const q = query(collection(db, "readingRoomSubmissions"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSubmissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingReadingRoomItem));
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
  
  const fileExists = async (path: string): Promise<boolean> => {
      if (!path) return false;
      try {
          await getMetadata(ref(storage, path));
          return true;
      } catch (error: any) {
          if (error.code === 'storage/object-not-found') {
              return false;
          }
          throw error; // Rethrow other errors
      }
  }

  const handleReview = async (submission: PendingSubmission, action: 'approve' | 'reject', reason?: string) => {
    if (!currentUser) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in to perform this action.', variant: 'destructive' });
        return;
    }
    
    const submissionData = submission as PendingReadingRoomItem;
    const submissionRef = doc(db, "readingRoomSubmissions", submission.id);

    try {
        const batch = writeBatch(db);

        if (action === 'approve') {
            const { id, status, ...liveData } = submissionData;
            // Create a new document in the live collection
            const liveDocRef = doc(collection(db, 'readingRoomPdfs'));
            
            batch.set(liveDocRef, {
                ...liveData,
                status: 'approved',
                approvedBy: currentUser.uid,
                approvedAt: serverTimestamp(),
            });
            batch.delete(submissionRef);

            await batch.commit();

            toast({
                title: 'Document Approved',
                description: `"${submission.title}" is now live in the Reading Room.`,
            });
        } else { // Reject
             if (!reason) {
                toast({ title: 'Reason Required', description: 'Please provide a reason for rejection.', variant: 'destructive' });
                return;
            }
            
            // Delete associated files from storage only if they exist
            if (await fileExists(submissionData.storagePath)) {
                await deleteObject(ref(storage, submissionData.storagePath));
            }
            if (await fileExists(submissionData.coverImageStoragePath)) {
                await deleteObject(ref(storage, submissionData.coverImageStoragePath));
            }

            // Instead of deleting, we update the status to rejected
            batch.update(submissionRef, {
                status: 'rejected',
                rejectionReason: reason,
                reviewedBy: currentUser.uid,
                reviewedAt: serverTimestamp(),
            });
            
            await batch.commit();
            
            toast({
                title: 'Document Rejected',
                description: `"${submission.title}" has been rejected and feedback has been saved.`,
            });
        }
    } catch (error: any) {
        console.error(`Error ${action}ing document:`, error);
        toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    } finally {
        setRejectionDialogState({isOpen: false, submission: null});
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Document Submissions</CardTitle>
          <CardDescription>
            Approve or reject documents submitted by your team for the Reading Room.
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
            <CardTitle>Review Document Submissions</CardTitle>
            <CardDescription>
            Approve or reject documents submitted by your team for the Reading Room.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {submissions.length > 0 ? (
            <ReviewReadingRoomSubmissionsTable submissions={submissions} onReview={handleReview} openRejectionDialog={openRejectionDialog}/>
            ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground mt-2">There are no pending document submissions to review.</p>
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
