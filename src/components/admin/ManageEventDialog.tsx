
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required') as z.ZodType<TranslationKey>,
  descriptionKey: z.string().min(1, 'Key is required') as z.ZodType<TranslationKey>,
  tagKeys: z.string().min(1, 'At least one tag key is required').transform(val => val.split(',').map(s => s.trim()) as TranslationKey[]),
  readMoreUrl: z.string().url('Must be a valid URL'),
  date: z.date({
    required_error: "A date is required.",
  }),
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
      date: event?.date || undefined,
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
                        <Input placeholder="e.g. event_ambedkar_birth_title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 px-6 pb-6">
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
