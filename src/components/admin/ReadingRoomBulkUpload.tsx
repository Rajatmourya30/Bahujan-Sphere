
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Download, FileUp, Loader2, Table, UploadCloud, X, FileCheck, AlertCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

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
  
  const uploadFile = (file: StagedFile): Promise<{ downloadURL: string, storagePath: string }> => {
    return new Promise((resolve, reject) => {
        const uniqueFileName = `${Date.now()}-${file.file.name}`;
        const storagePath = `pdfs/${uniqueFileName}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file.file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setStagedFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress } : f));
            },
            (error) => {
                console.error('Upload Error:', error);
                setStagedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', errorMessage: error.message } : f));
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setStagedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'success', progress: 100 } : f));
                    resolve({ downloadURL, storagePath });
                } catch (error) {
                    setStagedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', errorMessage: 'Failed to get URL.' } : f));
                    reject(error);
                }
            }
        );
    });
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    
    setIsUploading(true);
    setStagedFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

    const uploadPromises = stagedFiles.map(file => uploadFile(file).catch(e => e));
    const results = await Promise.allSettled(uploadPromises);
    
    const successfulUploads = stagedFiles.filter((_, i) => results[i].status === 'fulfilled');
    
    if (successfulUploads.length > 0) {
        try {
            const batch = writeBatch(db);
            successfulUploads.forEach((file, index) => {
                const result = results.find(r => r.status === 'fulfilled' && (r.value as any).storagePath.includes(file.file.name))?.value as any;
                if(result) {
                    const docRef = collection(db, "readingRoomPdfs");
                    const title = file.file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
                     batch.set(addDoc(docRef).withConverter(null), {
                        title: title,
                        author: "", // Can be edited later
                        url: result.downloadURL,
                        storagePath: result.storagePath,
                        coverImageUrl: null,
                        coverImageStoragePath: null,
                        uploadedAt: serverTimestamp(),
                        uploaderUid: user.uid,
                    });
                }
            });
            await batch.commit();
            
             toast({
                title: 'Bulk Upload Complete',
                description: `${successfulUploads.length} of ${stagedFiles.length} documents uploaded successfully.`,
            });
            setStagedFiles(prev => prev.filter(f => f.status !== 'success'));
        } catch (error) {
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
          Drag and drop multiple PDF files or use the button to select them.
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
