
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

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageUrl: z.string().url('Must be a valid URL'),
  imageAiHint: z.string().min(1, 'AI Hint is required'),
  affiliateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pdfUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pdfFile: z.any().optional(),
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
      imageUrl: book?.imageUrl || '',
      imageAiHint: book?.imageAiHint || '',
      affiliateUrl: book?.affiliateUrl || '',
      pdfUrl: book?.pdfUrl || '',
    },
  });

  const onSubmit = (values: FormValues) => {
    // In a real app, you would handle the file upload here
    // and set the pdfUrl based on the uploaded file's location.
    // For this demo, we'll just log the file name if it exists.
    if (values.pdfFile && values.pdfFile.length > 0) {
        console.log("Uploaded file:", values.pdfFile[0].name);
        // This is where you would set the actual URL after upload
        values.pdfUrl = `/pdfs/${values.pdfFile[0].name}`;
    }
    onSave(values);
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
             <ScrollArea className="max-h-[70vh] -mr-6 pr-6">
                <div className="space-y-4 py-4 pr-1">
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
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                            <Input type="url" placeholder="https://placehold.co/400x600.png" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
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
                        <FormField
                            control={form.control}
                            name="pdfUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Or enter PDF URL</FormLabel>
                                <FormControl>
                                <Input type="url" placeholder="https://example.com/book.pdf" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
