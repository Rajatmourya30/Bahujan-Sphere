
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ReviewSubmissionsTable, type PendingSubmission } from '../ReviewSubmissionsTable';
import type { User } from 'firebase/auth';

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

  const handleReview = async (submission: PendingSubmission, action: 'approve' | 'reject') => {
    if (!currentUser) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in to perform this action.', variant: 'destructive' });
        return;
    }
    
    const submissionData = submission as PendingReadingRoomItem;

    try {
        const batch = writeBatch(db);
        const submissionRef = doc(db, "readingRoomSubmissions", submission.id);

        if (action === 'approve') {
            const { id, status, ...liveData } = submissionData;
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
            await deleteDoc(submissionRef);
            
            // Delete associated files from storage
            const pdfRef = ref(storage, submissionData.storagePath);
            await deleteObject(pdfRef);

            const coverRef = ref(storage, submissionData.coverImageStoragePath);
            await deleteObject(coverRef);
            
            toast({
                title: 'Document Rejected',
                description: `"${submission.title}" has been removed from the queue.`,
            });
        }
    } catch (error: any) {
        console.error(`Error ${action}ing document:`, error);
        toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
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
    <Card>
      <CardHeader>
        <CardTitle>Review Document Submissions</CardTitle>
        <CardDescription>
          Approve or reject documents submitted by your team for the Reading Room.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <ReviewSubmissionsTable submissions={submissions} onReview={handleReview} />
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground mt-2">There are no pending document submissions to review.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
