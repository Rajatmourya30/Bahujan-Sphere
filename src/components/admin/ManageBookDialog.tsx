
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Book } from '@/lib/books';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { getDownloadURL, ref, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageFile: z.any().optional(),
  affiliateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pdfFile: z.any().optional(),
}).refine(data => {
    // When adding a new book (data.book is null), an image file is required.
    // When editing an existing book, a new image file is not required.
    return (data.book && data.book.imageUrl) || (data.imageFile && data.imageFile.length > 0);
}, {
    message: "An image file is required when adding a new book.",
    path: ["imageFile"],
});


type FormValues = z.infer<typeof formSchema> & { book?: Book | null };

interface ManageBookDialogProps {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Book, 'id'>) => void;
  managePdfUrl?: boolean;
  manageAffiliateUrl?: boolean;
}

const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

export function ManageBookDialog({
    book,
    onOpenChange,
    onSave,
    managePdfUrl = false,
    manageAffiliateUrl = true
}: ManageBookDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleKey: book?.titleKey || '',
      authorKey: book?.authorKey || '',
      descriptionKey: book?.descriptionKey || '',
      affiliateUrl: book?.affiliateUrl || '',
      book: book,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
        let imageUrl = book?.imageUrl || '';
        if (values.imageFile?.[0]) {
            setUploadMessage('Uploading cover image...');
            const file = values.imageFile[0];
            const imagePath = `book-covers/${Date.now()}_${file.name}`;
            imageUrl = await uploadFile(file, imagePath, setUploadProgress);
        }

        let pdfUrl: string | undefined = book?.pdfUrl;
        if (managePdfUrl && values.pdfFile?.[0]) {
            setUploadProgress(0);
            setUploadMessage('Uploading PDF...');
            const file = values.pdfFile[0];
            const pdfPath = `pdfs/${Date.now()}_${file.name}`;
            pdfUrl = await uploadFile(file, pdfPath, setUploadProgress);
        }
        
        const bookData: Omit<Book, 'id'> = {
            titleKey: values.titleKey,
            authorKey: values.authorKey,
            descriptionKey: values.descriptionKey,
            affiliateUrl: values.affiliateUrl || '',
            imageUrl,
            pdfUrl,
            imageAiHint: 'book cover' // Default value since input is removed
        };

        onSave(bookData);
        onOpenChange(false);

    } catch (error) {
        console.error("Upload failed:", error);
        toast({
            title: "Upload Failed",
            description: "There was an error uploading a file. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsUploading(false);
        setUploadMessage('');
        setUploadProgress(0);
    }
};

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the book.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
             <ScrollArea className="max-h-[60vh] p-4">
                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="titleKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title Key</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. book_annihilation_of_caste_title" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="authorKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Author Key</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. book_annihilation_of_caste_author" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="descriptionKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description Key</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g. book_annihilation_of_caste_desc" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="imageFile"
                        render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                            <FormLabel>Book Cover Image</FormLabel>
                            <FormControl>
                            <Input 
                                type="file" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => {
                                    onChange(e.target.files);
                                }}
                                {...rest} 
                                disabled={isUploading}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     {book?.imageUrl && !form.watch('imageFile')?.[0] && (
                        <div className="text-sm text-muted-foreground">Current image: <a href={book.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">View Image</a></div>
                     )}
                    
                    {manageAffiliateUrl && (
                    <FormField
                        control={form.control}
                        name="affiliateUrl"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Affiliate URL</FormLabel>
                            <FormControl>
                            <Input type="url" placeholder="https://example.com/affiliate-link" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    )}
                    
                    {managePdfUrl && (
                    <>
                        <FormField
                            control={form.control}
                            name="pdfFile"
                            render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel>Upload PDF</FormLabel>
                                <FormControl>
                                <Input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => {
                                        onChange(e.target.files);
                                    }}
                                    {...rest} 
                                    disabled={isUploading}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         {book?.pdfUrl && !form.watch('pdfFile')?.[0] && (
                            <div className="text-sm text-muted-foreground">Current PDF: <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">View PDF</a></div>
                        )}
                    </>
                    )}

                    {isUploading && (
                        <div className="space-y-2 pt-2">
                           <Label>{uploadMessage} {uploadProgress.toFixed(0)}%</Label>
                           <Progress value={uploadProgress} />
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 px-6 pb-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
