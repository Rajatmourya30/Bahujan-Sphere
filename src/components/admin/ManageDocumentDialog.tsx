
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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Zod schema for validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  // Files are not directly handled by zod, so we make them optional here
  // and perform manual checks in the submit handler.
  coverImageFile: z.any().optional(),
  pdfFile: z.any().optional(),
});

// Type for form values based on the schema
type FormValues = z.infer<typeof formSchema>;

// Type for the data passed to the onSave function
export interface DocumentFormData extends FormValues {}

interface ManageDocumentDialogProps {
  document: ReadingRoomPdf | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: DocumentFormData) => Promise<void>;
}

export function ManageDocumentDialog({ document, onOpenChange, onSave }: ManageDocumentDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document?.title || '',
      author: document?.author || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    // Add file objects from the form refs to the values object
    const fileInputs = (form.control._formRef.current as unknown as HTMLFormElement).elements;
    const coverInput = fileInputs.namedItem('coverImageFile') as HTMLInputElement;
    const pdfInput = fileInputs.namedItem('pdfFile') as HTMLInputElement;

    const data: DocumentFormData = {
      ...values,
      coverImageFile: coverInput?.files?.[0],
      pdfFile: pdfInput?.files?.[0],
    };

    // If we're creating a new document, the PDF file is required.
    if (!document && !data.pdfFile) {
      form.setError("pdfFile", { type: "manual", message: "A PDF file is required for new documents." });
      setIsSaving(false);
      return;
    }

    await onSave(data);
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'Add New Document'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the document.
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
                  <FormLabel>Author (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the author" {...field} value={field.value ?? ''} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="coverImageFile"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cover Image (optional)</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" {...field} disabled={isSaving} name="coverImageFile" />
                        </FormControl>
                         {document && <p className="text-xs text-muted-foreground">Uploading a new image will replace the old one.</p>}
                        <FormMessage />
                    </FormItem>
                )}
            />
             {!document && (
                <FormField
                    control={form.control}
                    name="pdfFile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>PDF File</FormLabel>
                            <FormControl>
                                <Input type="file" accept=".pdf" {...field} disabled={isSaving} name="pdfFile" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            <DialogFooter className="pt-4">
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
      </DialogContent>
    </Dialog>
  );
}
