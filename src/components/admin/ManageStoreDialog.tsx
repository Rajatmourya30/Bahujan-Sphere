
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
import type { BahujanStore } from '@/lib/store';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  nameKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageUrl: z.string().url('Must be a valid URL'),
  storeUrl: z.string().url('Must be a valid URL'),
  imageAiHint: z.string().min(1, 'AI Hint is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageStoreDialogProps {
  store: BahujanStore | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<BahujanStore, 'id'>) => void;
}

export function ManageStoreDialog({ store, onOpenChange, onSave }: ManageStoreDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameKey: store?.nameKey || '',
      descriptionKey: store?.descriptionKey || '',
      imageUrl: store?.imageUrl || '',
      storeUrl: store?.storeUrl || '',
      imageAiHint: store?.imageAiHint || '',
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl flex flex-col h-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{store ? 'Edit Store' : 'Add New Store'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the store.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow pr-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nameKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name Key</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. store_name_1" {...field} />
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
                        <Textarea placeholder="e.g. store_desc_1" {...field} />
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
                        <Input type="url" placeholder="https://placehold.co/400x400.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com" {...field} />
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
                        <Input placeholder="e.g. store logo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6 flex-shrink-0">
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
