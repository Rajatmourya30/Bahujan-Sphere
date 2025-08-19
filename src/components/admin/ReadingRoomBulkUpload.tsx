
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Download, FileUp, Loader2, UploadCloud, X, FileCheck, AlertCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
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
        const page = await pdf.getPage(1);
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


type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

interface StagedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  errorMessage?: string;
}

export function ReadingRoomBulkUpload() {
  const { toast } = useToast();
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: StagedFile[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        status: 'pending',
        progress: 0,
      }));
      
    setStagedFiles(prev => {
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
    setStagedFiles(prev => prev.filter(f => f.id !== id));
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

  const processAndUploadFile = (stagedFile: StagedFile): Promise<any> => {
     return new Promise(async (resolve, reject) => {
        try {
            const coverFile = await generateCoverFromPdf(stagedFile.file);
            let coverInfo: { downloadURL: string; storagePath: string } | null = null;
            if (coverFile) {
                const coverPath = `bookCovers/${Date.now()}-${coverFile.name}`;
                coverInfo = await uploadSingleFile(coverPath, coverPath, () => {});
            }

            const pdfPath = `pdfs/${Date.now()}-${stagedFile.file.name}`;
            const pdfInfo = await uploadSingleFile(stagedFile.file, pdfPath, (progress) => {
                setStagedFiles(prev => prev.map(f => f.id === stagedFile.id ? { ...f, progress } : f));
            });
            
            setStagedFiles(prev => prev.map(f => f.id === stagedFile.id ? { ...f, status: 'success' } : f));
            resolve({
                id: stagedFile.id,
                title: stagedFile.file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
                pdfInfo,
                coverInfo
            });
        } catch (error: any) {
            setStagedFiles(prev => prev.map(f => f.id === stagedFile.id ? { ...f, status: 'error', errorMessage: error.message } : f));
            reject({id: stagedFile.id, error});
        }
    });
  }


  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    
    setIsUploading(true);
    setStagedFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

    const uploadPromises = stagedFiles.filter(f => f.status === 'uploading').map(processAndUploadFile);

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
                    author: "",
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
                description: `${successfulUploads.length} of ${stagedFiles.length} documents uploaded successfully.`,
            });
            setStagedFiles(prev => prev.filter(f => f.status !== 'success'));
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
    if (stagedFiles.length === 0) return 0;
    const totalProgress = stagedFiles.reduce((acc, file) => acc + file.progress, 0);
    return totalProgress / stagedFiles.length;
  }, [stagedFiles]);
  
  const filesReadyToUpload = stagedFiles.filter(f => f.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Document Upload</CardTitle>
        <CardDescription>
          Drag and drop multiple PDF files or use the button to select them. A cover image will be generated for each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <p className="mt-2 text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
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

        {stagedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Staged for Upload ({stagedFiles.length} files)</h3>
            {isUploading && <Progress value={overallProgress} className="w-full" />}
            <ScrollArea className="h-64 w-full rounded-md border">
              <div className="p-2 space-y-2">
                {stagedFiles.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    <div className="flex-shrink-0">
                        {item.status === 'success' && <FileCheck className="text-green-500" />}
                        {item.status === 'error' && <AlertCircle className="text-destructive" />}
                        {(item.status === 'pending' || item.status === 'uploading') && <Loader2 className={cn("text-muted-foreground", item.status === 'uploading' && "animate-spin")} />}
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <p className="text-sm font-semibold truncate">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">{(item.file.size / (1024*1024)).toFixed(2)} MB</p>
                         {item.status === 'uploading' && <Progress value={item.progress} className="h-1 mt-1" />}
                         {item.status === 'error' && <p className="text-xs text-destructive truncate">{item.errorMessage}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 w-6 h-6" onClick={() => removeFile(item.id)} disabled={isUploading}>
                        <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleSubmit} disabled={isUploading || filesReadyToUpload.length === 0} className="w-full">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploading ? `Uploading... (${Math.round(overallProgress)}%)` : `Upload ${filesReadyToUpload.length} File(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
