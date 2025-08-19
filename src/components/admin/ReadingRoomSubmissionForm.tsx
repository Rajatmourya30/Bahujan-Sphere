
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ReadingRoomSubmissionForm() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [language, setLanguage] = useState('');
    const [publicationYear, setPublicationYear] = useState('');

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if(currentUser) {
                const userDocRef = doc(db, 'teamMembers', currentUser.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    }
                } catch(error) {
                    console.error("Error fetching user role:", error);
                    setUserRole(null);
                }
            } else {
                setUserRole(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setDescription('');
        setTags('');
        setLanguage('');
        setPublicationYear('');
        setPdfFile(null);
        setCoverImageFile(null);
        setCoverImagePreview(null);
        setFileName('');
        setFileSize(0);
        setPageCount(0);
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
        setIsUploading(false);
        setUploadProgress(0);
    }

    const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPdfFile(file);
        setFileName(file.name);
        setFileSize(file.size);

        // Extract metadata
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) return;
            try {
                const loadingTask = pdfjs.getDocument({ data: event.target.result as ArrayBuffer });
                const pdf = await loadingTask.promise;
                setPageCount(pdf.numPages);
            } catch (error) {
                console.error("Failed to get page count", error);
                toast({ title: "Could not read PDF metadata.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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

    const handleSubmit = async () => {
        const requiredFields = { title, author, description, pdfFile, coverImageFile };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value) {
                toast({ title: "Missing Information", description: `Please provide a value for ${key}.`, variant: "destructive" });
                return;
            }
        }
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const canPublishDirectly = userRole === 'Admin' || userRole === 'Manager';
        const collectionName = canPublishDirectly ? 'readingRoomPdfs' : 'readingRoomSubmissions';
        const status = canPublishDirectly ? 'approved' : 'pending';

        try {
            const coverPath = `bookCovers/${Date.now()}-${coverImageFile!.name}`;
            const coverImageInfo = await uploadFile(coverImageFile!, coverPath);

            const pdfPath = `pdfs/${Date.now()}-${pdfFile!.name}`;
            const pdfInfo = await uploadFile(pdfFile!, pdfPath, setUploadProgress);

            const dataToSave: any = {
                title, author, description,
                tags: tags.split(',').map(s => s.trim()).filter(Boolean),
                language: language || null,
                publicationYear: publicationYear ? Number(publicationYear) : null,
                url: pdfInfo.downloadURL,
                storagePath: pdfInfo.storagePath,
                coverImageUrl: coverImageInfo.downloadURL,
                coverImageStoragePath: coverImageInfo.storagePath,
                fileName, fileSize, pageCount,
                status,
            };

            if (canPublishDirectly) {
                dataToSave.approvedBy = user.uid;
                dataToSave.approvedAt = serverTimestamp();
                dataToSave.uploaderUid = user.uid;
                dataToSave.uploadedAt = serverTimestamp();
            } else {
                dataToSave.submittedBy = user.email || 'Admin';
                dataToSave.submittedAt = serverTimestamp();
            }
            
            await addDoc(collection(db, collectionName), dataToSave);

            toast({ 
                title: canPublishDirectly ? "Document Published!" : "Submission successful!", 
                description: canPublishDirectly ? `"${title}" is now live in the Reading Room.` : `"${title}" has been sent for review.`
            });

            resetForm();
            
        } catch (error) {
            console.error("Error during submission:", error);
            toast({ title: "Submission Failed", description: "Something went wrong during the submission.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit a Single Document</CardTitle>
                <CardDescription>
                    Upload a new PDF document with its metadata. All fields are required except where noted.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isUploading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isUploading} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isUploading} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pdf">PDF File</Label>
                        <Input id="pdf" type="file" accept=".pdf" onChange={handlePdfChange} disabled={isUploading} ref={pdfInputRef}/>
                        {pageCount > 0 && <p className="text-xs text-muted-foreground">{pageCount} pages, {(fileSize / 1024 / 1024).toFixed(2)} MB</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cover">Cover Image</Label>
                        <Input id="cover" type="file" accept="image/*" onChange={handleCoverImageChange} disabled={isUploading} ref={coverInputRef} />
                        {coverImagePreview && <Image src={coverImagePreview} alt="Cover preview" width={60} height={80} className="mt-2 rounded-md border" />}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
                        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} disabled={isUploading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="language">Language (optional)</Label>
                        <Input id="language" placeholder="e.g., en" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isUploading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pubYear">Publication Year (optional)</Label>
                        <Input id="pubYear" type="number" placeholder="e.g., 1936" value={publicationYear} onChange={(e) => setPublicationYear(e.target.value)} disabled={isUploading} />
                    </div>
                </div>

                {isUploading && <Progress value={uploadProgress} />}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSubmit} disabled={isUploading || !pdfFile || !title || !author || !description || !coverImageFile} className="w-full">
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Submitting...' : (userRole === 'Admin' || userRole === 'Manager' ? 'Publish Directly' : 'Submit for Review')}
                </Button>
            </CardFooter>
        </Card>
    );
}
