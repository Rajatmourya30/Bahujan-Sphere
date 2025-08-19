
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, MoreHorizontal, PlusCircle, Loader2, UploadCloud, FileText, Search, Trash2, Edit } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, type Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ManageDocumentDialog, type DocumentFormData } from '@/components/admin/ManageDocumentDialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  const handleOpenDialog = (doc: ReadingRoomPdf | null = null) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const uploadFile = (file: File, path: string): Promise<{ downloadURL: string, storagePath: string }> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
           if (path.startsWith('pdfs/')) {
             const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
             setUploadProgress(progress);
           }
        },
        (error) => reject(error),
        async () => {
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
                if (editingDocument.coverImageStoragePath) {
                    await deleteObject(ref(storage, editingDocument.coverImageStoragePath));
                }
            }
            await updateDoc(docRef, updateData);
            toast({ title: "Success", description: `"${data.title}" has been updated.` });

        } else { // This part is now handled by handleUpload
            return;
        }
    } catch (error: any) {
        console.error("Error saving document:", error);
        toast({ title: "Save Failed", description: "Could not save the document details.", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!user || !fileToUpload || !title) {
        toast({ title: "Missing Information", description: "A title and PDF file are required.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
        let coverImageInfo: { downloadURL: string; storagePath: string } | null = null;
        if (coverImageFile) {
            const coverPath = `bookCovers/${Date.now()}-${coverImageFile.name}`;
            coverImageInfo = await uploadFile(coverImageFile, coverPath);
        }
        
        const pdfPath = `pdfs/${Date.now()}-${fileToUpload.name}`;
        const pdfInfo = await uploadFile(fileToUpload, pdfPath);

        await addDoc(collection(db, "readingRoomPdfs"), {
            title: title,
            author: author,
            url: pdfInfo.downloadURL,
            storagePath: pdfInfo.storagePath,
            coverImageUrl: coverImageInfo?.downloadURL || null,
            coverImageStoragePath: coverImageInfo?.storagePath || null,
            uploadedAt: serverTimestamp(),
            uploaderUid: user.uid
        });

        toast({ title: "Upload successful!", description: `"${title}" is now available.` });
        setTitle('');
        setAuthor('');
        setFileToUpload(null);
        setCoverImageFile(null);
        
    } catch (error) {
        console.error("Error during upload:", error);
        toast({ title: "Upload Failed", description: "Something went wrong during the upload.", variant: "destructive" });
    } finally {
        setIsUploading(false);
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
        <p className="text-muted-foreground">Add, edit, or remove documents from the public reading room.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UploadCloud />
                        Upload New Document
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isUploading} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="author">Author (Optional)</Label>
                        <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isUploading} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cover">Cover Image (Optional)</Label>
                        <Input id="cover" type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} disabled={isUploading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pdf">PDF File</Label>
                        <Input id="pdf" type="file" accept=".pdf" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} disabled={isUploading} />
                    </div>
                    {isUploading && <Progress value={uploadProgress} />}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpload} disabled={isUploading || !fileToUpload || !title} className="w-full">
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
                </CardFooter>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Available Documents</CardTitle>
                    <CardDescription>Manage existing documents in the reading room.</CardDescription>
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
                                         <Button size="sm" variant="outline" onClick={() => handleOpenDialog(pdf)}>
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
          </div>
      </div>
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
