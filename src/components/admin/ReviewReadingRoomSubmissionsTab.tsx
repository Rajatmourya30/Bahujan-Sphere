
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DatabaseZap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Check, X } from 'lucide-react';
import type { ReadingRoomPdf } from '@/app/admin/reading-room/page';
import { ref, copyObject, deleteObject } from 'firebase/storage';
import { sampleSubmissions, seedSampleSubmissions } from '@/lib/sample-data';

export interface PendingReadingRoomItem extends Omit<ReadingRoomPdf, 'id' | 'uploadedAt'> {
    id: string;
    submittedAt: any;
    submittedBy: string;
    status: 'pending' | 'approved' | 'rejected';
}

export function ReviewReadingRoomSubmissionsTab() {
  const [submissions, setSubmissions] = useState<PendingReadingRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "readingRoomSubmissions"), orderBy("submittedAt", "desc"));
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

  const handleSeedData = async () => {
    try {
        await seedSampleSubmissions();
        toast({ title: 'Success', description: 'Sample submissions have been added to Firestore.' });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  const handleReview = async (submission: PendingReadingRoomItem, action: 'approve' | 'reject') => {
    try {
        if (action === 'approve') {
            const newDocRef = doc(collection(db, "readingRoomPdfs"));
            
            // Move files from pending folders to final folders
            const newPdfPath = `pdfs/${submission.fileName}`;
            const newCoverPath = `bookCovers/${submission.coverImageStoragePath.split('/').pop()}`;

            await copyObject(ref(storage, submission.storagePath), ref(storage, newPdfPath));
            await copyObject(ref(storage, submission.coverImageStoragePath), ref(storage, newCoverPath));

            const approvedData = { ...submission };
            delete (approvedData as any).id;
            delete (approvedData as any).submittedAt;
            delete (approvedData as any).submittedBy;
            delete (approvedData as any).status;

            await setDoc(newDocRef, {
                ...approvedData,
                storagePath: newPdfPath,
                coverImageStoragePath: newCoverPath,
                uploadedAt: serverTimestamp(),
                uploaderUid: submission.submittedBy,
            });

            toast({
                title: 'Document Approved',
                description: `"${submission.title}" is now live.`,
            });
        }
        
        // Delete original storage files and firestore doc
        await deleteObject(ref(storage, submission.storagePath));
        await deleteObject(ref(storage, submission.coverImageStoragePath));
        await deleteDoc(doc(db, "readingRoomSubmissions", submission.id));

        if (action === 'reject') {
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
          <CardTitle>Review Submissions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Review Submissions</CardTitle>
            <CardDescription>
                Approve or reject documents submitted for the Reading Room.
            </CardDescription>
        </div>
        <Button variant="outline" onClick={handleSeedData}>
            <DatabaseZap className="mr-2 h-4 w-4" />
            Seed Sample Data
        </Button>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <div className="relative h-20 w-16 flex-shrink-0">
                                        <Image
                                            src={item.coverImageUrl || 'https://placehold.co/400x600.png'}
                                            alt={item.title}
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.author}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div>{item.submittedBy}</div>
                                <div className="text-sm text-muted-foreground">
                                    {item.submittedAt ? formatDistanceToNow(item.submittedAt.toDate(), { addSuffix: true }) : 'Just now'}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 border-green-600/40 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => handleReview(item, 'approve')}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-600/40 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleReview(item, 'reject')}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
