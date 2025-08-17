
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
import type { CalendarEvent } from '@/lib/events';
import type { TranslationKey } from '@/lib/i18n/translations';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required') as z.ZodType<TranslationKey>,
  descriptionKey: z.string().min(1, 'Key is required') as z.ZodType<TranslationKey>,
  tagKeys: z.string().min(1, 'At least one tag key is required').transform(val => val.split(',').map(s => s.trim()) as TranslationKey[]),
  readMoreUrl: z.string().url('Must be a valid URL'),
  day: z.coerce.number().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31'),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageEventDialogProps {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
}

export function ManageEventDialog({ event, onOpenChange, onSave }: ManageEventDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleKey: event?.titleKey || '',
      descriptionKey: event?.descriptionKey || '',
      tagKeys: event?.tagKeys || [],
      readMoreUrl: event?.readMoreUrl || '',
      day: event?.day || undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the calendar event. These are translation keys.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="titleKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. event_ambedkar_birth_title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Month</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 14" {...field} />
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
                     <Textarea placeholder="e.g. event_ambedkar_birth_desc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tagKeys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Keys</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. tag_ambedkarite,tag_buddhist" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="readMoreUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Read More URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com" {...field} />
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
