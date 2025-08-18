
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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageUrl: z.string().url().optional(),
  imageFile: z.any().optional(),
  imageAiHint: z.string().min(1, 'AI Hint is required'),
  affiliateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pdfUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pdfFile: z.any().optional(),
}).refine(data => data.imageUrl || (data.imageFile && data.imageFile.length > 0) || (data.book && data.book.imageUrl), {
    message: "An image URL or an uploaded image is required.",
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

const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleKey: book?.titleKey || '',
      authorKey: book?.authorKey || '',
      descriptionKey: book?.descriptionKey || '',
      imageUrl: book?.imageUrl || '',
      imageAiHint: book?.imageAiHint || '',
      affiliateUrl: book?.affiliateUrl || '',
      pdfUrl: book?.pdfUrl || '',
      book: book,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true);
    try {
        const bookData: Omit<Book, 'id'> = {
            titleKey: values.titleKey,
            authorKey: values.authorKey,
            descriptionKey: values.descriptionKey,
            imageAiHint: values.imageAiHint,
            affiliateUrl: values.affiliateUrl || '',
            pdfUrl: book?.pdfUrl || '', // Start with existing PDF URL
            imageUrl: book?.imageUrl || '', // Start with existing image URL
        };

        if (values.imageFile && values.imageFile.length > 0) {
            const file = values.imageFile[0];
            const imagePath = `book-covers/${Date.now()}_${file.name}`;
            bookData.imageUrl = await uploadFile(file, imagePath);
        }

        if (values.pdfFile && values.pdfFile.length > 0) {
            const file = values.pdfFile[0];
            const pdfPath = `pdfs/${Date.now()}_${file.name}`;
            bookData.pdfUrl = await uploadFile(file, pdfPath);
        }

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
             <ScrollArea className="max-h-[70vh] -mr-3 pr-4">
                <div className="space-y-4 py-4 px-1">
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
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     {book?.imageUrl && !form.watch('imageFile') && (
                        <div className="text-sm text-muted-foreground">Current image: <a href={book.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">View Image</a></div>
                     )}
                    <FormField
                    control={form.control}
                    name="imageAiHint"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image AI Hint</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. book cover" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
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
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         {book?.pdfUrl && !form.watch('pdfFile') && (
                            <div className="text-sm text-muted-foreground">Current PDF: <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">View PDF</a></div>
                        )}
                    </>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
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
