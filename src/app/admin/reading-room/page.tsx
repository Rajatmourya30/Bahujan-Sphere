
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Trash2, Edit, PlusCircle } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref, deleteObject } from 'firebase/storage';
import { collection, query, orderBy, onSnapshot, type Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ManageDocumentDialog, type DocumentFormData } from '@/components/admin/ManageDocumentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadingRoomSubmissionForm } from '@/components/admin/ReadingRoomSubmissionForm';
import { ReadingRoomBulkUpload } from '@/components/admin/ReadingRoomBulkUpload';
import { ReviewReadingRoomSubmissionsTab } from '@/components/admin/ReviewReadingRoomSubmissionsTab';

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
  const [activeTab, setActiveTab] = useState('manage');

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
  
  const filteredPdfs = useMemo(() => {
    return availablePdfs.filter(pdf => 
      pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pdf.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availablePdfs]);

  const handleOpenEditDialog = (doc: ReadingRoomPdf) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: DocumentFormData) => {
    if (!user || !editingDocument) {
        toast({ title: "Not Authenticated or No Document to Edit", description: "You must be signed in and editing a document.", variant: "destructive" });
        return;
    }
    
    try {
        const docRef = doc(db, "readingRoomPdfs", editingDocument.id);
        const updateData: Partial<ReadingRoomPdf> = {
            title: data.title,
            author: data.author,
            description: data.description,
            tags: data.tags,
            language: data.language,
            publicationYear: data.publicationYear,
        };

        if (data.newCoverImage) {
            // Delete old cover image if it exists
            if (editingDocument.coverImageStoragePath) {
                const oldCoverRef = ref(storage, editingDocument.coverImageStoragePath);
                await deleteObject(oldCoverRef).catch(err => console.error("Old cover delete failed, continuing:", err));
            }

            // Upload new cover image
            const newCoverPath = `bookCovers/${Date.now()}-${data.newCoverImage.name}`;
            const newCoverRef = ref(storage, newCoverPath);
            const uploadTaskSnapshot = await uploadBytesResumable(newCoverRef, data.newCoverImage);
            const newCoverUrl = await getDownloadURL(uploadTaskSnapshot.ref);
            
            updateData.coverImageUrl = newCoverUrl;
            updateData.coverImageStoragePath = newCoverPath;
        }

        await updateDoc(docRef, updateData);
        toast({ title: "Success", description: `"${data.title}" has been updated.` });

    } catch (error: any) {
        console.error("Error saving document:", error);
        toast({ title: "Save Failed", description: "Could not save the document details.", variant: "destructive" });
    }
  };

  const handleDelete = async (pdf: ReadingRoomPdf) => {
    try {
        const fileRef = ref(storage, pdf.storagePath);
        await deleteObject(fileRef);
        
        if (pdf.coverImageStoragePath) {
          const coverImageRef = ref(storage, pdf.coverImageStoragePath);
          await deleteObject(coverImageRef);
        }

        await deleteDoc(doc(db, "readingRoomPdfs", pdf.id));

        toast({ title: "PDF Deleted", description: `"${pdf.title}" has been removed.` });
    } catch (error) {
        console.error("Error deleting PDF:", error);
        toast({ title: "Deletion Failed", description: "Could not delete the PDF. Check console for details.", variant: "destructive" });
    }
  };

  return (
    <>
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Reading Room</h1>
        <p className="text-muted-foreground">Add, edit, and manage all documents.</p>
      </header>
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
           <TabsTrigger value="manage">Manage Documents</TabsTrigger>
           <TabsTrigger value="review">Review Submissions</TabsTrigger>
           <TabsTrigger value="single-doc">Submit Single Document</TabsTrigger>
           <TabsTrigger value="bulk-upload">Submit Bulk Upload</TabsTrigger>
        </TabsList>
         <TabsContent value="manage" className="mt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Available Documents</CardTitle>
                        <CardDescription>Manage existing documents in the reading room.</CardDescription>
                    </div>
                     <Button onClick={() => setActiveTab('single-doc')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Document
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or author..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {isLoadingPdfs ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {filteredPdfs.length > 0 ? filteredPdfs.map(pdf => (
                                <div key={pdf.id} className="flex items-center gap-4 p-2 border rounded-lg">
                                    <div className="relative h-20 w-16 flex-shrink-0">
                                        <Image
                                            src={pdf.coverImageUrl || 'https://placehold.co/400x600.png'}
                                            alt={pdf.title}
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold leading-tight">{pdf.title}</h3>
                                        {pdf.author && <p className="text-sm text-muted-foreground">{pdf.author}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                         <Button asChild size="sm" variant="outline">
                                            <Link href={`/reading-room/${pdf.id}`} target="_blank" rel="noopener noreferrer">
                                                <BookOpen className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                         <Button size="sm" variant="outline" onClick={() => handleOpenEditDialog(pdf)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive">
                                                     <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete "{pdf.title}". This action cannot be undone.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(pdf)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">No documents found.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="review" className="mt-6">
            <ReviewReadingRoomSubmissionsTab />
        </TabsContent>
         <TabsContent value="single-doc" className="mt-6">
          <ReadingRoomSubmissionForm />
        </TabsContent>
         <TabsContent value="bulk-upload" className="mt-6">
          <ReadingRoomBulkUpload />
        </TabsContent>
      </Tabs>
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
