
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
import type { KnowledgeOrganization } from '@/lib/knowledge-hub';

const formSchema = z.object({
  nameKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  logoUrl: z.string().url('Must be a valid URL'),
  websiteUrl: z.string().url('Must be a valid URL'),
  imageAiHint: z.string().min(1, 'AI Hint is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageOrganizationDialogProps {
  organization: KnowledgeOrganization | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<KnowledgeOrganization, 'id'>) => void;
}

export function ManageOrganizationDialog({ organization, onOpenChange, onSave }: ManageOrganizationDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameKey: organization?.nameKey || '',
      descriptionKey: organization?.descriptionKey || '',
      logoUrl: organization?.logoUrl || '',
      websiteUrl: organization?.websiteUrl || '',
      imageAiHint: organization?.imageAiHint || '',
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{organization ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nameKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. org_1_name" {...field} />
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
                    <Textarea placeholder="e.g. org_1_desc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://placehold.co/400x400.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
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
                    <Input placeholder="e.g. organization logo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
