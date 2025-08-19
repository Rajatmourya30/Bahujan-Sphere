
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Trash2, Edit, PlusCircle } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref, deleteObject } from 'firebase/storage';
import { collection, query, orderBy, onSnapshot, type Timestamp, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ManageDocumentDialog, type DocumentFormData } from '@/components/admin/ManageDocumentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { ReadingRoomTable } from '@/components/admin/ReadingRoomTable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export interface ReadingRoomPdf {
  id: string;
  title: string;
  author: string;
  description: string;
  url: string;
  storagePath: string;
  uploadedAt: Timestamp;
  uploaderUid: string;
  coverImageUrl: string;
  coverImageStoragePath: string;
  fileName: string;
  fileSize: number; // in bytes
  pageCount: number;
  tags?: string[];
  language?: string;
  publicationYear?: number;
}


export default function ManageReadingRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  
  const [availablePdfs, setAvailablePdfs] = useState<ReadingRoomPdf[]>([]);
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ReadingRoomPdf | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');

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

    const q = query(
        collection(db, "readingRoomPdfs"), 
        orderBy("uploadedAt", "desc")
    );
    const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
        const pdfs: ReadingRoomPdf[] = [];
        querySnapshot.forEach((doc) => {
            pdfs.push({ id: doc.id, ...doc.data() } as ReadingRoomPdf);
        });
        setAvailablePdfs(pdfs);
        setIsLoadingPdfs(false);
    }, (error) => {
        console.error("Error fetching PDFs:", error);
        toast({ title: "Error", description: "Could not load the PDF list.", variant: "destructive" });
        setIsLoadingPdfs(false);
    });

    return () => unsubscribeFirestore();
  }, [user, toast]);
  
  const filteredPdfs = availablePdfs.filter(pdf => 
    pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pdf.author && pdf.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenDialog = (doc: ReadingRoomPdf | null) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: DocumentFormData) => {
    if (!user) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return;
    }
    
    try {
        if (editingDocument) { // Editing existing document
            const docRef = doc(db, "readingRoomPdfs", editingDocument.id);
            await updateDoc(docRef, data);
            toast({ title: "Success", description: "Document details updated." });
        } else { // Adding a new document
            if (!data.pdfFile) {
                toast({ title: "File Required", description: "A PDF file is required to add a new document.", variant: "destructive" });
                return;
            }
            // For simplicity, we'll assume PDF upload is part of the dialog logic for "add new"
            // This would need a more robust implementation for real-world use.
            // For now, let's assume `onSave` from dialog provides the necessary URLs.
            await addDoc(collection(db, 'readingRoomPdfs'), {
                ...data,
                uploadedAt: serverTimestamp(),
                uploaderUid: user.uid,
            });
            toast({ title: "Success", description: `"${data.title}" has been added.` });
        }
    } catch (error: any) {
        console.error("Error saving document:", error);
        toast({ title: "Save Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (pdf: ReadingRoomPdf) => {
    try {
        const docRef = doc(db, "readingRoomPdfs", pdf.id);
        await deleteDoc(docRef);

        if (pdf.storagePath) {
            const fileRef = ref(storage, pdf.storagePath);
            await deleteObject(fileRef).catch((error) => console.warn("Could not delete PDF file:", error));
        }
        
        if (pdf.coverImageStoragePath) {
          const coverImageRef = ref(storage, pdf.coverImageStoragePath);
          await deleteObject(coverImageRef).catch((error) => console.warn("Could not delete cover image:", error));
        }

        toast({ title: "PDF Deleted", description: `"${pdf.title}" has been removed.` });
    } catch (error) {
        console.error("Error deleting PDF:", error);
        toast({ title: "Deletion Failed", description: "Could not delete the PDF.", variant: "destructive" });
    }
  };

  return (
    <>
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="font-headline text-3xl font-bold">Manage Reading Room</h1>
            <p className="text-muted-foreground">Add, edit, and manage all documents.</p>
        </div>
        <Button onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="mr-2" />
            Add Document
        </Button>
      </header>
      <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Available Documents</CardTitle>
                    <CardDescription>Manage existing documents in the reading room.</CardDescription>
                </div>
                <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or author..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent>
              {isLoadingPdfs ? (
                  <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
              ) : filteredPdfs.length > 0 ? (
                  <ReadingRoomTable documents={filteredPdfs} onEdit={handleOpenDialog} onDelete={handleDelete}/>
              ) : (
                  <p className="text-center text-muted-foreground py-8">No documents found.</p>
              )}
          </CardContent>
      </Card>
    </div>
     {isDialogOpen && (
        <ManageDocumentDialog
          document={editingDocument}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
        />
      )}
    </>
  );
}
