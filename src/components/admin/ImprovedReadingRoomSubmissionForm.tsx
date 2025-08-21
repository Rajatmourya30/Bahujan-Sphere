'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import Image from 'next/image';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker with fallback
try {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (error) {
    console.warn('PDF.js worker configuration failed:', error);
}

interface UploadError {
    code: string;
    message: string;
    details?: string;
}

export function ImprovedReadingRoomSubmissionForm() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isTeamMember, setIsTeamMember] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);

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
    const [uploadError, setUploadError] = useState<UploadError | null>(null);

    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setAuthError(null);
            
            if (currentUser) {
                try {
                    // Check if user is a team member
                    const teamQuery = query(collection(db, "teamMembers"), where("email", "==", currentUser.email));
                    const querySnapshot = await getDocs(teamQuery);
                    
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0].data();
                        setUserRole(userDoc.role);
                        setIsTeamMember(true);
                        console.log('User authenticated as team member:', userDoc.role);
                    } else {
                        setUserRole(null);
                        setIsTeamMember(false);
                        setAuthError('You are not authorized to upload files. Please contact an administrator.');
                    }
                } catch (error) {
                    console.error("Error checking team membership:", error);
                    setAuthError('Failed to verify permissions. Please try refreshing the page.');
                    setIsTeamMember(false);
                }
            } else {
                setUserRole(null);
                setIsTeamMember(false);
                setAuthError('Please log in to upload files.');
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
        setUploadError(null);
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
        setIsUploading(false);
        setUploadProgress(0);
    }

    const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast({ 
                title: "Invalid File Type", 
                description: "Please select a PDF file.", 
                variant: "destructive" 
            });
            return;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            toast({ 
                title: "File Too Large", 
                description: "PDF file must be smaller than 50MB.", 
                variant: "destructive" 
            });
            return;
        }

        setPdfFile(file);
        setFileName(file.name);
        setFileSize(file.size);

        // Extract metadata with better error handling
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) return;
                try {
                    const loadingTask = pdfjs.getDocument({ data: event.target.result as ArrayBuffer });
                    const pdf = await loadingTask.promise;
                    setPageCount(pdf.numPages);
                    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
                } catch (error) {
                    console.error("Failed to get page count", error);
                    setPageCount(0);
                    toast({ 
                        title: "PDF Processing Warning", 
                        description: "Could not read PDF metadata, but upload can continue.", 
                        variant: "default" 
                    });
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Error reading PDF file:", error);
            toast({ 
                title: "File Reading Error", 
                description: "Could not read the PDF file.", 
                variant: "destructive" 
            });
        }
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image file type
        if (!file.type.startsWith('image/')) {
            toast({ 
                title: "Invalid File Type", 
                description: "Please select an image file.", 
                variant: "destructive" 
            });
            return;
        }

        // Validate image size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast({ 
                title: "Image Too Large", 
                description: "Cover image must be smaller than 10MB.", 
                variant: "destructive" 
            });
            return;
        }

        setCoverImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadFile = (file: File, path: string, onProgress?: (progress: number) => void): Promise<{ downloadURL: string, storagePath: string }> => {
        return new Promise((resolve, reject) => {
            try {
                const storageRef = ref(storage, path);
                const uploadTask = uploadBytesResumable(storageRef, file);
                
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                        console.log(`Upload progress: ${progress}%`);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        let errorMessage = 'Upload failed';
                        let errorCode = 'unknown';
                        
                        if (error.code) {
                            errorCode = error.code;
                            switch (error.code) {
                                case 'storage/unauthorized':
                                    errorMessage = 'You do not have permission to upload files. Please contact an administrator.';
                                    break;
                                case 'storage/canceled':
                                    errorMessage = 'Upload was canceled.';
                                    break;
                                case 'storage/quota-exceeded':
                                    errorMessage = 'Storage quota exceeded.';
                                    break;
                                case 'storage/invalid-format':
                                    errorMessage = 'Invalid file format.';
                                    break;
                                case 'storage/invalid-argument':
                                    errorMessage = 'Invalid upload parameters.';
                                    break;
                                default:
                                    errorMessage = `Upload failed: ${error.message}`;
                            }
                        }
                        
                        reject({ code: errorCode, message: errorMessage, details: error.message });
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            console.log('Upload completed successfully:', downloadURL);
                            resolve({ downloadURL, storagePath: path });
                        } catch (error: any) {
                            console.error('Error getting download URL:', error);
                            reject({ code: 'download-url-error', message: 'Failed to get download URL', details: error.message });
                        }
                    }
                );
            } catch (error: any) {
                console.error('Error starting upload:', error);
                reject({ code: 'upload-start-error', message: 'Failed to start upload', details: error.message });
            }
        });
    };

    const handleSubmit = async () => {
        setUploadError(null);
        
        // Validation
        const requiredFields = { title, author, description, pdfFile, coverImageFile };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value) {
                toast({ title: "Missing Information", description: `Please provide a value for ${key}.`, variant: "destructive" });
                return;
            }
        }

        if (!user) {
            setUploadError({ code: 'not-authenticated', message: 'You must be logged in to upload files.' });
            return;
        }

        if (!isTeamMember) {
            setUploadError({ code: 'not-authorized', message: 'You are not authorized to upload files. Please contact an administrator.' });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const canPublishDirectly = userRole === 'Admin' || userRole === 'Manager';
        const collectionName = canPublishDirectly ? 'readingRoomPdfs' : 'readingRoomSubmissions';
        const status = canPublishDirectly ? 'approved' : 'pending';

        try {
            console.log('Starting upload process...');
            
            // Upload cover image first
            const coverPath = `bookCovers/${Date.now()}-${coverImageFile!.name}`;
            console.log('Uploading cover image to:', coverPath);
            const coverImageInfo = await uploadFile(coverImageFile!, coverPath);
            console.log('Cover image uploaded successfully');

            // Upload PDF
            const pdfPath = `pdfs/${Date.now()}-${pdfFile!.name}`;
            console.log('Uploading PDF to:', pdfPath);
            const pdfInfo = await uploadFile(pdfFile!, pdfPath, setUploadProgress);
            console.log('PDF uploaded successfully');

            // Save to Firestore
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
            
            console.log('Saving to Firestore collection:', collectionName);
            await addDoc(collection(db, collectionName), dataToSave);
            console.log('Document saved successfully');

            toast({ 
                title: canPublishDirectly ? "Document Published!" : "Submission successful!", 
                description: canPublishDirectly ? `"${title}" is now live in the Reading Room.` : `"${title}" has been sent for review.`
            });

            resetForm();
            
        } catch (error: any) {
            console.error("Error during submission:", error);
            
            if (error.code && error.message) {
                setUploadError(error as UploadError);
            } else {
                setUploadError({
                    code: 'submission-error',
                    message: 'Something went wrong during the submission.',
                    details: error.message || 'Unknown error'
                });
            }
            
            toast({ 
                title: "Submission Failed", 
                description: error.message || "Something went wrong during the submission.", 
                variant: "destructive" 
            });
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
                {authError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                )}

                {uploadError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Upload Error ({uploadError.code}):</strong> {uploadError.message}
                            {uploadError.details && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer">Technical Details</summary>
                                    <pre className="text-xs mt-1 whitespace-pre-wrap">{uploadError.details}</pre>
                                </details>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {isTeamMember && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            You are authenticated as: <strong>{userRole}</strong>
                            {userRole === 'Admin' || userRole === 'Manager' 
                                ? ' - Documents will be published directly.' 
                                : ' - Documents will be sent for review.'}
                        </AlertDescription>
                    </Alert>
                )}

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
                        <Label htmlFor="pdf">PDF File (Max 50MB)</Label>
                        <Input id="pdf" type="file" accept=".pdf" onChange={handlePdfChange} disabled={isUploading} ref={pdfInputRef}/>
                        {pageCount > 0 && <p className="text-xs text-muted-foreground">{pageCount} pages, {(fileSize / 1024 / 1024).toFixed(2)} MB</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cover">Cover Image (Max 10MB)</Label>
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

                {isUploading && (
                    <div className="space-y-2">
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground text-center">
                            Uploading... {Math.round(uploadProgress)}%
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handleSubmit} 
                    disabled={isUploading || !pdfFile || !title || !author || !description || !coverImageFile || !isTeamMember} 
                    className="w-full"
                >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Submitting...' : (userRole === 'Admin' || userRole === 'Manager' ? 'Publish Directly' : 'Submit for Review')}
                </Button>
            </CardFooter>
        </Card>
    );
}
