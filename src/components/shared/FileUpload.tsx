
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, type StorageReference } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  filePath: string; // e.g., "profile-pictures/userId" or "book-covers"
  currentFileUrl?: string | null;
  onUploadComplete: (downloadUrl: string) => void;
  onRemoveComplete?: () => void;
  acceptedFileTypes?: string;
  className?: string;
}

export function FileUpload({
  label,
  filePath,
  currentFileUrl,
  onUploadComplete,
  onRemoveComplete,
  acceptedFileTypes = "image/png, image/jpeg, image/webp",
  className,
}: FileUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', description: 'Please choose a file to upload.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // First, delete the old file if it exists
    if (currentFileUrl) {
      try {
        const oldFileRef = ref(storage, currentFileUrl);
        await deleteObject(oldFileRef);
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          console.log("Old file not found, proceeding with upload.");
        } else {
          console.warn("Could not delete old file, proceeding anyway:", error);
        }
      }
    }

    // Now, upload the new file
    const storageRef = ref(storage, `${filePath}/${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        toast({ title: 'Upload Failed', description: 'Please check your permissions and try again.', variant: 'destructive' });
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadURL);
          toast({ title: 'Upload Successful', description: `${selectedFile.name} has been uploaded.` });
        } catch (error) {
          toast({ title: 'Update Failed', description: 'Failed to save the new file reference.', variant: 'destructive' });
        } finally {
          setIsUploading(false);
          setSelectedFile(null);
        }
      }
    );
  };
  
  const handleRemove = async () => {
    if (!currentFileUrl) return;
    setIsRemoving(true);
    try {
        const fileRef = ref(storage, currentFileUrl);
        await deleteObject(fileRef);
        toast({ title: 'File Removed' });
        if(onRemoveComplete) {
            onRemoveComplete();
        }
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            toast({ title: 'File already removed', variant: 'default' });
            if(onRemoveComplete) onRemoveComplete(); // Sync state even if file not in storage
        } else {
            console.error("Error removing file:", error);
            toast({ title: 'Removal Failed', description: 'Could not remove the file.', variant: 'destructive' });
        }
    } finally {
        setIsRemoving(false);
    }
  }


  return (
    <div className={cn("space-y-4", className)}>
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileChange}
                disabled={isUploading || isRemoving}
            />
        </div>

        {selectedFile && (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                {isUploading && <Progress value={uploadProgress} className="h-2" />}
                <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload and Save
                </Button>
            </div>
        )}

        {currentFileUrl && (
             <div className="space-y-2">
                <Alert>
                    <AlertDescription className="flex items-center justify-between">
                         <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="truncate text-sm underline hover:text-primary">
                            View Current File
                        </a>
                         <Button onClick={handleRemove} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" disabled={isRemoving}>
                            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                         </Button>
                    </AlertDescription>
                </Alert>
             </div>
        )}
    </div>
  );
}
