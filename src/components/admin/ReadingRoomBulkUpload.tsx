
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, UploadCloud, X, FileCheck, AlertCircle, Settings, CheckCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { ConfigurePdfDialog } from './ConfigurePdfDialog';

type FileStatus = 'pending' | 'configured' | 'uploading' | 'success' | 'error';

export interface StagedPdf {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  errorMessage?: string;
  title: string;
  author: string;
  coverImageFile: File | null;
  coverImagePreviewUrl: string | null;
}

export function ReadingRoomBulkUpload() {
  const { toast } = useToast();
  const [stagedPdfs, setStagedPdfs] = useState<StagedPdf[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [configuringPdf, setConfiguringPdf] = useState<StagedPdf | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: StagedPdf[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        status: 'pending',
        progress: 0,
        title: file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
        author: '',
        coverImageFile: null,
        coverImagePreviewUrl: null,
      }));
      
    setStagedPdfs(prev => {
        const existingIds = new Set(prev.map(f => f.id));
        const trulyNewFiles = newFiles.filter(f => !existingIds.has(f.id));
        return [...prev, ...trulyNewFiles];
    });
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setStagedPdfs(prev => prev.filter(f => f.id !== id));
  };

  const handleSaveMetadata = (updatedPdf: StagedPdf) => {
    setStagedPdfs(prev => prev.map(p => p.id === updatedPdf.id ? {...updatedPdf, status: 'configured'} : p));
    setConfiguringPdf(null);
  };
  
  const uploadSingleFile = (file: File, path: string, onProgress: (p: number) => void): Promise<{ downloadURL: string, storagePath: string }> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error('Upload Error:', error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ downloadURL, storagePath: path });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
  };

  const processAndUploadFile = (stagedPdf: StagedPdf): Promise<any> => {
     return new Promise(async (resolve, reject) => {
        try {
            let coverInfo: { downloadURL: string; storagePath: string } | null = null;
            if (stagedPdf.coverImageFile) {
                const coverPath = `bookCovers/${Date.now()}-${stagedPdf.coverImageFile.name}`;
                coverInfo = await uploadSingleFile(stagedPdf.coverImageFile, coverPath, () => {});
            }

            const pdfPath = `pdfs/${Date.now()}-${stagedPdf.file.name}`;
            const pdfInfo = await uploadSingleFile(stagedPdf.file, pdfPath, (progress) => {
                setStagedPdfs(prev => prev.map(f => f.id === stagedPdf.id ? { ...f, progress } : f));
            });
            
            setStagedPdfs(prev => prev.map(f => f.id === stagedPdf.id ? { ...f, status: 'success' } : f));
            resolve({
                id: stagedPdf.id,
                title: stagedPdf.title,
                author: stagedPdf.author,
                pdfInfo,
                coverInfo
            });
        } catch (error: any) {
            setStagedPdfs(prev => prev.map(f => f.id === stagedPdf.id ? { ...f, status: 'error', errorMessage: error.message } : f));
            reject({id: stagedPdf.id, error});
        }
    });
  }

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    const filesToUpload = stagedPdfs.filter(pdf => pdf.status === 'configured');
    if (filesToUpload.length === 0) {
        toast({ title: 'No Configured Files', description: 'Please configure metadata for at least one file before uploading.', variant: 'destructive' });
        return;
    }
    
    setIsUploading(true);
    setStagedPdfs(prev => prev.map(f => f.status === 'configured' ? { ...f, status: 'uploading', progress: 0 } : f));

    const uploadPromises = filesToUpload.map(processAndUploadFile);
    const results = await Promise.allSettled(uploadPromises);
    
    const successfulUploads = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

    if (successfulUploads.length > 0) {
        try {
            const batch = writeBatch(db);
            const readingRoomCollection = collection(db, "readingRoomPdfs");

            successfulUploads.forEach(upload => {
                const docRef = doc(readingRoomCollection);
                batch.set(docRef, {
                    title: upload.title,
                    author: upload.author,
                    url: upload.pdfInfo.downloadURL,
                    storagePath: upload.pdfInfo.storagePath,
                    coverImageUrl: upload.coverInfo?.downloadURL || null,
                    coverImageStoragePath: upload.coverInfo?.storagePath || null,
                    uploadedAt: serverTimestamp(),
                    uploaderUid: user.uid,
                });
            });
            await batch.commit();
            
             toast({
                title: 'Bulk Upload Complete',
                description: `${successfulUploads.length} of ${filesToUpload.length} documents uploaded successfully.`,
            });
            setStagedPdfs(prev => prev.filter(f => f.status !== 'success'));
        } catch (error) {
            console.error("Firestore batch commit error:", error);
             toast({ title: 'Firestore Error', description: 'Files uploaded, but failed to save metadata.', variant: 'destructive' });
        }
    } else {
         toast({ title: 'Upload Failed', description: 'No documents were uploaded successfully.', variant: 'destructive' });
    }

    setIsUploading(false);
  };
  
  const overallProgress = useMemo(() => {
    const uploadingFiles = stagedPdfs.filter(f => f.status === 'uploading');
    if (uploadingFiles.length === 0) return 0;
    const totalProgress = uploadingFiles.reduce((acc, file) => acc + file.progress, 0);
    return totalProgress / uploadingFiles.length;
  }, [stagedPdfs]);
  
  const filesToUploadCount = stagedPdfs.filter(f => f.status === 'configured' || f.status === 'uploading').length;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Bulk Document Upload</CardTitle>
        <CardDescription>
          Select multiple PDFs, configure their metadata individually, then upload them all at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <div 
            className={cn(
                "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            >
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Drag & drop PDF files here, or click to browse</p>
            <input 
                id="bulk-pdf-upload"
                type="file" 
                accept=".pdf" 
                multiple 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFilesSelected(e.target.files)}
                disabled={isUploading}
            />
            </div>
        </div>


        {stagedPdfs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Staged for Upload ({stagedPdfs.length} files)</h3>
            {isUploading && <Progress value={overallProgress} className="w-full" />}
            <ScrollArea className="h-64 w-full rounded-md border">
              <div className="p-2 space-y-2">
                {stagedPdfs.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    <div className="flex-shrink-0">
                        {item.status === 'success' && <FileCheck className="text-green-500" />}
                        {item.status === 'error' && <AlertCircle className="text-destructive" />}
                        {item.status === 'configured' && <CheckCircle className="text-blue-500" />}
                        {item.status === 'pending' && <Settings className="text-muted-foreground" />}
                        {item.status === 'uploading' && <Loader2 className="animate-spin" />}
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.file.name}</p>
                         {item.status === 'uploading' && <Progress value={item.progress} className="h-1 mt-1" />}
                         {item.status === 'error' && <p className="text-xs text-destructive truncate">{item.errorMessage}</p>}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setConfiguringPdf(item)} disabled={isUploading}>
                        Configure
                    </Button>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 w-6 h-6" onClick={() => removeFile(item.id)} disabled={isUploading}>
                        <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isUploading || filesToUploadCount === 0} className="w-full">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {isUploading ? `Uploading... (${Math.round(overallProgress)}%)` : `Upload ${filesToUploadCount} Configured File(s)`}
        </Button>
      </CardFooter>
    </Card>
    {configuringPdf && (
        <ConfigurePdfDialog
            pdf={configuringPdf}
            onOpenChange={(isOpen) => !isOpen && setConfiguringPdf(null)}
            onSave={handleSaveMetadata}
        />
    )}
    </>
  );
}
