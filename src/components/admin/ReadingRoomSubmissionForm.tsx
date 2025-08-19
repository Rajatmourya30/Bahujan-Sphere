
'use client';

import { useState } from 'react';
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

export function ReadingRoomSubmissionForm() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useState(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    });

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setCoverImageFile(null);
        setPdfFile(null);
        setIsUploading(false);
        setUploadProgress(0);
    }

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

    const handleUpload = async () => {
        if (!user || !pdfFile || !title) {
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
            
            const pdfPath = `pdfs/${Date.now()}-${pdfFile.name}`;
            const pdfInfo = await uploadFile(pdfFile, pdfPath);

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
            toast({ title: "Upload Failed", description: "Something went wrong during the upload.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit a Single Document</CardTitle>
                <CardDescription>
                    Upload a new PDF document to the reading room.
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
                    <Label htmlFor="cover">Cover Image (Optional)</Label>
                    <Input id="cover" type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} disabled={isUploading} />
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

    