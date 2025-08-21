
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import { CalendarIcon, ImageUp } from "lucide-react"

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
import { useState, useRef } from 'react';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  tags: z.string().min(1, 'At least one tag is required').transform(val => val.split(',').map(s => s.trim())),
  readMoreUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  date: z.date({
    required_error: "A date is required.",
  }),
  imageFile: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageEventDialogProps {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<CalendarEvent, 'id'>, newImageFile?: File) => void;
}

export function ManageEventDialog({ event, onOpenChange, onSave }: ManageEventDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || '',
      summary: event?.summary || '',
      tags: Array.isArray(event?.tags) ? event.tags.join(', ') : '',
      readMoreUrl: event?.readMoreUrl || '',
      date: event?.date ? new Date(event.date as any) : undefined,
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
    // We remove `imageFile` from the data being saved to Firestore
    const { imageFile, ...eventData } = values;
    onSave(eventData as Omit<CalendarEvent, 'id'>, imageFile || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the calendar event.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Birth of Dr. B. R. Ambedkar" {...field} />
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
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. A short summary of the event's significance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Image</FormLabel>
                  <FormControl>
                     <Input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                           const file = e.target.files?.[0];
                           if(file) {
                               field.onChange(file);
                               handleImageChange(e);
                           }
                        }}
                      />
                  </FormControl>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <Image
                        src={imagePreview || 'https://placehold.co/400x400.png'}
                        alt="Event image preview"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <ImageUp className="mr-2 h-4 w-4" />
                      Change Image
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Ambedkarite, Buddhist" 
                      {...field} 
                      value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                    />
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
