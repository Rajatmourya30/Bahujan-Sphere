
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL, uploadBytes } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadingRoomSubmissionForm } from '@/components/admin/ReadingRoomSubmissionForm';
import { ReadingRoomBulkUpload } from '@/components/admin/ReadingRoomBulkUpload';
import { ReviewReadingRoomSubmissionsTab } from '@/components/admin/review/ReviewReadingRoomSubmissionsTab';
import { ReadingRoomTable } from '@/components/admin/ReadingRoomTable';
import { ManageDocumentDialog, type DocumentFormData } from '@/components/admin/ManageDocumentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReadingRoomStatsDashboard } from '@/components/admin/ReadingRoomStatsDashboard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export interface ReadingRoomPdf {
  id: string;
  title: string;
  author?: string;
  description?: string;
  url: string;
  storagePath: string;
  coverImageUrl?: string;
  coverImageStoragePath?: string;
  uploadedAt: any;
  status?: 'approved' | 'pending' | 'rejected';
  tags?: string[];
  language?: string;
  publicationYear?: number;
}

export default function ManageReadingRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<ReadingRoomPdf[]>([]);
  const [editingDocument, setEditingDocument] = useState<ReadingRoomPdf | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace('/admin/login');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "readingRoomPdfs"), orderBy("uploadedAt", "desc"));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingRoomPdf));
        setDocuments(docs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching documents:", error);
        toast({ title: 'Error', description: 'Could not fetch documents.', variant: 'destructive' });
        setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [user, toast]);

  const handleOpenDialog = (doc: ReadingRoomPdf | null = null) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const handleDelete = (docToDelete: ReadingRoomPdf) => {
    setDocumentToDelete(docToDelete.id);
  };

  const confirmRemove = async () => {
    if (!documentToDelete) return;
    
    const docToDelete = documents.find(doc => doc.id === documentToDelete);
    if (!docToDelete) return;

    try {
        // Delete Firestore document
        await deleteDoc(doc(db, 'readingRoomPdfs', docToDelete.id));

        // Delete PDF from Storage
        if (docToDelete.storagePath) {
            const pdfRef = ref(storage, docToDelete.storagePath);
            await deleteObject(pdfRef);
        }

        // Delete Cover Image from Storage
        if (docToDelete.coverImageStoragePath) {
            const coverRef = ref(storage, docToDelete.coverImageStoragePath);
            await deleteObject(coverRef);
        }

        toast({ title: 'Success', description: 'Document and associated files have been deleted.' });
    } catch (error) {
        console.error("Error deleting document:", error);
        toast({ title: 'Error', description: 'Failed to delete the document.', variant: 'destructive' });
    } finally {
        setDocumentToDelete(null);
    }
  };

  const handleSave = async (data: DocumentFormData) => {
    if (!editingDocument) return;

    try {
        let newCoverImageUrl = editingDocument.coverImageUrl;
        let newCoverImageStoragePath = editingDocument.coverImageStoragePath;

        if (data.newCoverImage) {
            // Delete old cover image if it exists
            if (editingDocument.coverImageStoragePath) {
                const oldCoverRef = ref(storage, editingDocument.coverImageStoragePath);
                await deleteObject(oldCoverRef).catch(err => console.warn("Old cover not found, skipping deletion.", err));
            }
            // Upload new cover image
            const newCoverRef = ref(storage, `bookCovers/${Date.now()}-${data.newCoverImage.name}`);
            await uploadBytes(newCoverRef, data.newCoverImage);
            newCoverImageUrl = await getDownloadURL(newCoverRef);
            newCoverImageStoragePath = newCoverRef.fullPath;
        }

        const { newCoverImage, ...docData } = data;
        const docRef = doc(db, 'readingRoomPdfs', editingDocument.id);
        await updateDoc(docRef, {
            ...docData,
            coverImageUrl: newCoverImageUrl,
            coverImageStoragePath: newCoverImageStoragePath,
        });

        toast({ title: 'Success', description: 'Document updated successfully.' });
    } catch (error) {
        console.error("Error updating document:", error);
        toast({ title: 'Error', description: 'Failed to update document.', variant: 'destructive' });
    }
  };
  
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
        <p className="text-muted-foreground">Manage, add, or review documents for the Reading Room.</p>
      </header>

      <ReadingRoomStatsDashboard />
      
      <Tabs defaultValue="manage">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage">Manage Documents</TabsTrigger>
          <TabsTrigger value="single-submit">Submit Single</TabsTrigger>
          <TabsTrigger value="bulk-submit">Bulk Upload</TabsTrigger>
          <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
            {documents.length > 0 ? (
                <ReadingRoomTable documents={documents} onEdit={handleOpenDialog} onDelete={handleDelete} />
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>No Documents Found</CardTitle>
                        <CardDescription>
                            There are no documents currently published in the Reading Room.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Use the "Submit Single" or "Bulk Upload" tabs to add new documents.
                        </p>
                    </CardContent>
                </Card>
            )}
        </TabsContent>
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

      {isDialogOpen && editingDocument && (
        <ManageDocumentDialog
            document={editingDocument}
            onOpenChange={setIsDialogOpen}
            onSave={handleSave}
        />
      )}

      <AlertDialog open={!!documentToDelete} onOpenChange={(isOpen) => !isOpen && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document and all associated files from the database and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
