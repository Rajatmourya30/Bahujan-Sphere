
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import * as pdfjs from 'pdfjs-dist';

// Helper function to generate cover image from PDF
async function generateCoverFromPdf(pdfFile: File): Promise<File | null> {
  pdfjs.GlobalWorkerOptions.workerSrc = `/static/js/pdf.worker.min.mjs`;

  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."));
      }
      try {
        const loadingTask = pdfjs.getDocument({ data: event.target.result as ArrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // Get the first page
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            return reject(new Error('Could not get canvas context'));
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        canvas.toBlob((blob) => {
          if (blob) {
            const coverFile = new File([blob], `${pdfFile.name}.jpg`, { type: 'image/jpeg' });
            resolve(coverFile);
          } else {
            reject(new Error("Canvas to Blob conversion failed."));
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        console.error("Error generating cover:", error);
        reject(error);
      }
    };
    fileReader.onerror = () => reject(new Error("FileReader error."));
    fileReader.readAsArrayBuffer(pdfFile);
  });
}


export function ReadingRoomSubmissionForm() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setPdfFile(null);
        setIsUploading(false);
        setUploadProgress(0);
    }

    const uploadFile = (file: File, path: string, onProgress?: (progress: number) => void): Promise<{ downloadURL: string, storagePath: string }> => {
        return new Promise((resolve, reject) => {
          const storageRef = ref(storage, path);
          const uploadTask = uploadBytesResumable(storageRef, file);
          uploadTask.on('state_changed',
            (snapshot) => {
               const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
               if (onProgress) onProgress(progress);
            },
            (error) => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ downloadURL, storagePath: path });
            }
          );
        });
    };

    const handleUpload = async () => {
        if (!user || !pdfFile || !title) {
            toast({ title: "Missing Information", description: "A title and PDF file are required.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const coverImageFile = await generateCoverFromPdf(pdfFile);
            let coverImageInfo: { downloadURL: string; storagePath: string } | null = null;
            
            if (coverImageFile) {
                const coverPath = `bookCovers/${Date.now()}-${coverImageFile.name}`;
                coverImageInfo = await uploadFile(coverImageFile, coverPath);
            }
            
            const pdfPath = `pdfs/${Date.now()}-${pdfFile.name}`;
            const pdfInfo = await uploadFile(pdfFile, pdfPath, setUploadProgress);

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
            resetForm();
            
        } catch (error) {
            console.error("Error during upload:", error);
            toast({ title: "Upload Failed", description: "Something went wrong during the upload. Cover generation might have failed.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit a Single Document</CardTitle>
                <CardDescription>
                    Upload a new PDF document. The cover image will be generated automatically.
                </CardDescription>
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
                    <Label htmlFor="pdf">PDF File</Label>
                    <Input id="pdf" type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} disabled={isUploading} />
                </div>
                {isUploading && <Progress value={uploadProgress} />}
            </CardContent>
            <CardFooter>
                <Button onClick={handleUpload} disabled={isUploading || !pdfFile || !title} className="w-full">
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
            </CardFooter>
        </Card>
    );
}
