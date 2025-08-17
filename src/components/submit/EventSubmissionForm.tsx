
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition } from 'react';
import { Wand2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTagSuggestions } from '@/lib/actions';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  date: z.string().min(1, 'Date is required.'),
  summary: z.string().min(20, 'Summary needs to be at least 20 characters.'),
  readMoreUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  body: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required.'),
});

export function EventSubmissionForm() {
  const [isPending, startTransition] = useTransition();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      date: '',
      summary: '',
      readMoreUrl: '',
      tags: [],
    },
  });

  const { watch, setValue, getValues } = form;
  const eventSummary = watch('summary');
  const currentTags = watch('tags');

  const handleSuggestTags = () => {
    startTransition(async () => {
      const result = await getTagSuggestions(eventSummary, currentTags);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        setSuggestedTags(result.suggestedTags.filter(t => !currentTags.includes(t)));
      }
    });
  };
  
  const addTag = (tag: string) => {
    if (!currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Event Submitted!",
      description: "Thank you for your contribution. It is now pending review.",
    })
    form.reset();
    setSuggestedTags([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Event Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Birth of Dr. B. R. Ambedkar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 14 April 1891" {...field} />
                  </FormControl>
                  <FormDescription>
                    Please use a descriptive date format.
                  </FormDescription>
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
                    <Textarea
                      placeholder="A short summary of the event's significance..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This summary will be used to suggest tags.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="readMoreUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Read More Link</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/source-of-information" {...field} />
                  </FormControl>
                  <FormDescription>
                    A link to a webpage with more information about the event (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="p-3 border rounded-md min-h-[40px] bg-background">
                       {currentTags.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                          {currentTags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                         </div>
                       ) : <p className="text-sm text-muted-foreground">Add tags below or get AI suggestions.</p>}
                    </div>
                  </FormControl>
                   <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <Button type="button" onClick={handleSuggestTags} disabled={isPending || !eventSummary}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isPending ? 'Suggesting...' : 'Suggest Tags with AI'}
                    </Button>
                    <div className="flex flex-wrap gap-2 items-center">
                        {suggestedTags.map(tag => (
                           <Button type="button" size="sm" variant="outline" key={tag} onClick={() => addTag(tag)}>
                                + {tag}
                           </Button>
                        ))}
                    </div>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg">Submit for Review</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
