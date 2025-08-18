
'use client';

import * as React from 'react';
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
import { FileUpload } from '../shared/FileUpload';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  affiliateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageBookDialogProps {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Book, 'id'>) => void;
  managePdfUrl?: boolean;
  manageAffiliateUrl?: boolean;
}

export function ManageBookDialog({
    book,
    onOpenChange,
    onSave,
    managePdfUrl = false,
    manageAffiliateUrl = true
}: ManageBookDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleKey: book?.titleKey || '',
      authorKey: book?.authorKey || '',
      descriptionKey: book?.descriptionKey || '',
      affiliateUrl: book?.affiliateUrl || '',
    },
  });
  
  // We need to manage image and PDF URLs outside the form state
  // as they are handled by a separate component.
  const [imageUrl, setImageUrl] = React.useState(book?.imageUrl || '');
  const [pdfUrl, setPdfUrl] = React.useState(book?.pdfUrl || '');

  const onSubmit = async (values: FormValues) => {
    if (!imageUrl) {
        form.setError('root', { type: 'manual', message: 'A cover image is required.' });
        return;
    }
    
    const bookData: Omit<Book, 'id'> = {
        titleKey: values.titleKey,
        authorKey: values.authorKey,
        descriptionKey: values.descriptionKey,
        affiliateUrl: values.affiliateUrl || '',
        imageUrl,
        pdfUrl: pdfUrl || undefined,
        imageAiHint: 'book cover'
    };

    onSave(bookData);
    onOpenChange(false);
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
                    
                    <FileUpload
                        label="Book Cover Image"
                        filePath="book-covers"
                        currentFileUrl={imageUrl}
                        onUploadComplete={setImageUrl}
                        onRemoveComplete={() => setImageUrl('')}
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
                     <FileUpload
                        label="Book PDF"
                        filePath="pdfs"
                        currentFileUrl={pdfUrl}
                        acceptedFileTypes=".pdf"
                        onUploadComplete={setPdfUrl}
                        onRemoveComplete={() => setPdfUrl('')}
                    />
                    )}

                    {form.formState.errors.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 px-6 pb-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
