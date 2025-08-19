
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
import { type ReadingRoomPdf } from '@/app/admin/reading-room/page';
import { useState, useRef } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  publicationYear: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface DocumentFormData extends FormValues {
    newCoverImage?: File | null;
}

interface ManageDocumentDialogProps {
  document: ReadingRoomPdf | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: DocumentFormData) => Promise<void>;
}

export function ManageDocumentDialog({ document, onOpenChange, onSave }: ManageDocumentDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(document?.coverImageUrl || null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document?.title || '',
      author: document?.author || '',
      description: document?.description || '',
      tags: document?.tags || [],
      language: document?.language || '',
      publicationYear: document?.publicationYear || undefined,
    },
  });

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    const dataToSave: DocumentFormData = {
      ...values,
      newCoverImage: coverImageFile,
    };
    await onSave(dataToSave);
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'Add New Document'}</DialogTitle>
          <DialogDescription>
            {document ? "Edit the metadata for this document." : "Use the 'Submit Single Document' tab to add new files."}
          </DialogDescription>
        </DialogHeader>
        {document ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of the book or document" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of the author" {...field} value={field.value ?? ''} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief summary of the content..." {...field} disabled={isSaving} />
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
                            src={coverImagePreview || 'https://placehold.co/400x600.png'}
                            alt="Cover image preview"
                            fill
                            className="object-cover rounded-md"
                        />
                    </div>
                    <div className="flex-grow">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleCoverImageChange}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSaving}
                        >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload New Cover
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Upload a new image to replace the existing cover.
                        </p>
                    </div>
                </div>
              </FormItem>
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="sociology, history, politics" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : ''} onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., en" {...field} value={field.value ?? ''} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publicationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Year (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1936" {...field} value={field.value ?? ''} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              <DialogFooter className="pt-4 sticky bottom-0 bg-background">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
            <div className="py-4">
                <p>Please use the dedicated tabs for submitting single or bulk documents.</p>
                 <DialogFooter className="pt-4">
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
