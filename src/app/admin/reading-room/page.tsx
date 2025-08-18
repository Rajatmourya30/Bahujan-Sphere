
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BookOpen, UploadCloud, FileText, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, type Timestamp, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ReadingRoomPdf {
  id: string;
  title: string;
  author?: string;
  url: string;
  storagePath: string;
  uploadedAt: Timestamp;
}

export default function ManageReadingRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const [availablePdfs, setAvailablePdfs] = useState<ReadingRoomPdf[]>([]);
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
          setUser(currentUser);
      } else {
        router.replace('/admin/login');
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
        setStatusMessage({ type: 'error', text: 'Could not load the PDF list.' });
        setIsLoadingPdfs(false);
    });

    return () => unsubscribeFirestore();
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            setStatusMessage({ type: 'error', text: 'Please select a valid PDF file.'});
            setFileToUpload(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setStatusMessage({ type: '', text: ''});
        setFileToUpload(file);
    }
  };

  const handleUpload = async () => {
    if (!user) {
        setStatusMessage({ type: 'error', text: 'You must be signed in to upload files.' });
        return;
    }
    if (!fileToUpload || !title) {
        setStatusMessage({ type: 'error', text: 'Please select a PDF file and provide a title.' });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage({ type: 'info', text: 'Starting upload...' });

    const uniqueFileName = `${Date.now()}-${fileToUpload.name}`;
    const storagePath = `pdfs/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            setStatusMessage({ type: 'info', text: `Uploading... ${Math.round(progress)}%` });
        },
        (error) => {
            console.error("Upload error:", error);
            let errorMessage = `Upload failed: ${error.message}`;
            if (error.code === 'storage/unauthorized') {
                errorMessage = "Upload failed. Please check your Storage security rules and CORS settings in the Firebase console.";
            }
            setStatusMessage({ type: 'error', text: errorMessage });
            setIsUploading(false);
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                await addDoc(collection(db, "readingRoomPdfs"), {
                    title,
                    author,
                    url: downloadURL,
                    storagePath: storagePath,
                    uploadedAt: serverTimestamp(),
                    uploaderUid: user.uid
                });

                toast({ title: "Upload successful!", description: `"${title}" is now available in the reading room.` });
                setStatusMessage({ type: '', text: '' });
                // Reset form
                setTitle('');
                setAuthor('');
                setFileToUpload(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } catch (error) {
                console.error("Error saving to Firestore:", error);
                setStatusMessage({ type: 'error', text: 'File uploaded, but failed to save details.' });
            } finally {
                setIsUploading(false);
            }
        }
    );
  };

  const handleDelete = async (pdf: ReadingRoomPdf) => {
    if (!window.confirm(`Are you sure you want to delete "${pdf.title}"? This action cannot be undone.`)) {
        return;
    }

    try {
        // Delete the file from Firebase Storage
        const fileRef = ref(storage, pdf.storagePath);
        await deleteObject(fileRef);

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
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Reading Room</h1>
        <p className="text-muted-foreground">Upload and manage PDFs available in the public reading room.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud />
                Upload New PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-title">Book Title</Label>
                <Input id="pdf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title of the book or document" disabled={isUploading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-author">Author (optional)</Label>
                <Input id="pdf-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Name of the author" disabled={isUploading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF File</Label>
                <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} disabled={isUploading} />
              </div>
              {isUploading && (
                <Progress value={uploadProgress} className="w-full" />
              )}
              {statusMessage.text && (
                <p className={`text-sm ${statusMessage.type === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {statusMessage.text}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleUpload} disabled={isUploading || !fileToUpload || !title}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText />
                Available PDFs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPdfs ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : availablePdfs.length > 0 ? (
                <div className="space-y-4">
                  {availablePdfs.map(pdf => (
                    <div key={pdf.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-grow">
                        <h3 className="font-semibold">{pdf.title}</h3>
                        {pdf.author && <p className="text-sm text-muted-foreground">{pdf.author}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm">
                          <Link href={`/reading-room/${pdf.id}`} target="_blank" rel="noopener noreferrer">
                            <BookOpen className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(pdf)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No PDFs Available</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a document to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
