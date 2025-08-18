
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, type Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ReadingRoomTable } from '@/components/admin/ReadingRoomTable';
import { ManageDocumentDialog, type DocumentFormData } from '@/components/admin/ManageDocumentDialog';

export interface ReadingRoomPdf {
  id: string;
  title: string;
  author?: string;
  url: string;
  storagePath: string;
  uploadedAt: Timestamp;
  coverImageUrl?: string;
  coverImageStoragePath?: string;
}

export default function ManageReadingRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const [availablePdfs, setAvailablePdfs] = useState<ReadingRoomPdf[]>([]);
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ReadingRoomPdf | null>(null);

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
  
  const handleOpenDialog = (doc: ReadingRoomPdf | null = null) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const uploadFile = (file: File, path: string): Promise<{ downloadURL: string, storagePath: string }> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        () => {}, // Progress
        (error) => reject(error), // Error
        async () => { // Complete
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, storagePath: path });
        }
      );
    });
  };

  const handleSave = async (data: DocumentFormData) => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be signed in.", variant: "destructive" });
        return;
    }
    
    try {
        let coverImageInfo: { downloadURL: string; storagePath: string } | null = null;
        if (data.coverImageFile) {
            const coverPath = `bookCovers/${Date.now()}-${data.coverImageFile.name}`;
            coverImageInfo = await uploadFile(data.coverImageFile, coverPath);
        }

        if (editingDocument) { // Editing existing document
            const docRef = doc(db, "readingRoomPdfs", editingDocument.id);
            const updateData: Partial<ReadingRoomPdf> = {
                title: data.title,
                author: data.author,
            };
            if (coverImageInfo) {
                updateData.coverImageUrl = coverImageInfo.downloadURL;
                updateData.coverImageStoragePath = coverImageInfo.storagePath;
                // Delete old cover image if it exists
                if (editingDocument.coverImageStoragePath) {
                    await deleteObject(ref(storage, editingDocument.coverImageStoragePath));
                }
            }
            await updateDoc(docRef, updateData);
            toast({ title: "Success", description: `"${data.title}" has been updated.` });

        } else { // Adding new document
            if (!data.pdfFile) {
                toast({ title: "Error", description: "A PDF file is required for new documents.", variant: "destructive" });
                return;
            }
            const pdfPath = `pdfs/${Date.now()}-${data.pdfFile.name}`;
            const pdfInfo = await uploadFile(data.pdfFile, pdfPath);

            await addDoc(collection(db, "readingRoomPdfs"), {
                title: data.title,
                author: data.author,
                url: pdfInfo.downloadURL,
                storagePath: pdfInfo.storagePath,
                coverImageUrl: coverImageInfo?.downloadURL || null,
                coverImageStoragePath: coverImageInfo?.storagePath || null,
                uploadedAt: serverTimestamp(),
                uploaderUid: user.uid
            });
            toast({ title: "Upload successful!", description: `"${data.title}" is now available.` });
        }
    } catch (error: any) {
        console.error("Error saving document:", error);
        toast({ title: "Save Failed", description: "Could not save the document details.", variant: "destructive" });
    }
  };


  const handleDelete = async (pdf: ReadingRoomPdf) => {
    if (!window.confirm(`Are you sure you want to delete "${pdf.title}"? This action cannot be undone.`)) {
        return;
    }

    try {
        // Delete the file from Firebase Storage
        const fileRef = ref(storage, pdf.storagePath);
        await deleteObject(fileRef);
        
        // Delete cover image if it exists
        if (pdf.coverImageStoragePath) {
          const coverImageRef = ref(storage, pdf.coverImageStoragePath);
          await deleteObject(coverImageRef);
        }

        // Delete the document from Firestore
        await deleteDoc(doc(db, "readingRoomPdfs", pdf.id));

        toast({ title: "PDF Deleted", description: `"${pdf.title}" has been removed.` });
    } catch (error) {
        console.error("Error deleting PDF:", error);
        toast({ title: "Deletion Failed", description: "Could not delete the PDF. Check console for details.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">Manage Reading Room</h1>
          <p className="text-muted-foreground">Add, edit, or remove documents from the public reading room.</p>
        </div>
         <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </header>

      <section>
        {isLoadingPdfs ? (
             <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
        ) : (
            <ReadingRoomTable
                documents={availablePdfs}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
            />
        )}
      </section>

      {isDialogOpen && (
        <ManageDocumentDialog
          document={editingDocument}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
