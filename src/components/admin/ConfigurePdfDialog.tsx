
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
import { useState, useRef, useEffect } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import type { StagedPdf } from './ReadingRoomBulkUpload';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConfigurePdfDialogProps {
  pdf: StagedPdf;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StagedPdf) => void;
}

export function ConfigurePdfDialog({ pdf, onOpenChange, onSave }: ConfigurePdfDialogProps) {
  const [coverImageFile, setCoverImageFile] = useState<File | null>(pdf.coverImageFile);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(pdf.coverImagePreviewUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: pdf.title || '',
      author: pdf.author || '',
    },
  });

  useEffect(() => {
    // Clean up preview URL when dialog closes
    return () => {
      if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverImagePreview);
      }
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: FormValues) => {
    const updatedPdf: StagedPdf = {
        ...pdf,
        title: values.title,
        author: values.author || '',
        coverImageFile: coverImageFile,
        coverImagePreviewUrl: coverImagePreview,
    };
    onSave(updatedPdf);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Configure Metadata</DialogTitle>
          <DialogDescription>
            Editing details for: <span className="font-semibold">{pdf.file.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of the book or document" {...field} />
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
                    <FormLabel>Author (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of the author" {...field} value={field.value ?? ''} />
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
                        >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload Cover
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Upload a custom cover image for this PDF.
                        </p>
                    </div>
                </div>
              </FormItem>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Metadata
                </Button>
              </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
