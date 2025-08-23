
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
import { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  affiliateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pdfUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageBookDialogProps {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Book, 'id' | 'imageUrl' | 'title' | 'author'>, newImageFile?: File) => void;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(book?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleKey: book?.titleKey || '',
      authorKey: book?.authorKey || '',
      descriptionKey: book?.descriptionKey || '',
      affiliateUrl: book?.affiliateUrl || '',
      pdfUrl: book?.pdfUrl || '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: FormValues) => {
    const dataToSave = { ...values, imageAiHint: book?.imageAiHint || 'book cover' };
    onSave(dataToSave, imageFile || undefined);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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

            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-20 flex-shrink-0">
                  <Image
                    src={imagePreview || 'https://placehold.co/400x600.png'}
                    alt="Cover image preview"
                    fill
                    className="object-cover rounded-md border"
                  />
                </div>
                <div className="flex-grow">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload New Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a new image to replace the existing one.
                  </p>
                </div>
              </div>
            </FormItem>

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
               <FormField
                control={form.control}
                name="pdfUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/book.pdf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
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
