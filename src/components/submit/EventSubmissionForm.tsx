
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, useEffect } from 'react';
import { Wand2, X, Loader2 } from 'lucide-react';

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
import { useLanguage } from '@/hooks/use-language';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  date: z.string().min(1, 'Date is required.'),
  summary: z.string().min(20, 'Summary needs to be at least 20 characters.'),
  readMoreUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  tags: z.array(z.string()).min(1, 'At least one tag is required.'),
});

export function EventSubmissionForm() {
  const [isAiPending, startAiTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  const { watch, setValue } = form;
  const eventSummary = watch('summary');
  const currentTags = watch('tags');

  const handleSuggestTags = () => {
    startAiTransition(async () => {
      const result = await getTagSuggestions(eventSummary, currentTags);
      if (result.error) {
        toast({
          title: t('event_submission.toast_error_title'),
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


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to submit an event.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, "eventSubmissions"), {
        ...values,
        submittedBy: user.email,
        submittedAt: serverTimestamp(),
      });
      toast({
        title: t('event_submission.toast_success_title'),
        description: t('event_submission.toast_success_description'),
      });
      form.reset();
      setSuggestedTags([]);
    } catch (error) {
      console.error("Error submitting event:", error);
      toast({
        title: "Submission Failed",
        description: "An error occurred while submitting the event.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('event_submission.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('event_submission.event_title_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('event_submission.event_title_placeholder')} {...field} disabled={isSubmitting}/>
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
                  <FormLabel>{t('event_submission.date_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('event_submission.date_placeholder')} {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormDescription>
                    {t('event_submission.date_description')}
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
                  <FormLabel>{t('event_submission.summary_label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('event_submission.summary_placeholder')}
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('event_submission.summary_description')}
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
                  <FormLabel>{t('event_submission.read_more_label')}</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder={t('event_submission.read_more_placeholder')} {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormDescription>
                    {t('event_submission.read_more_description')}
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
                  <FormLabel>{t('event_submission.tags_label')}</FormLabel>
                  <FormControl>
                    <div className="p-3 border rounded-md min-h-[40px] bg-background">
                       {currentTags.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                          {currentTags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5" disabled={isSubmitting}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                         </div>
                       ) : <p className="text-sm text-muted-foreground">{t('event_submission.tags_placeholder')}</p>}
                    </div>
                  </FormControl>
                   <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <Button type="button" onClick={handleSuggestTags} disabled={isAiPending || !eventSummary || isSubmitting}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isAiPending ? t('event_submission.suggest_tags_loading') : t('event_submission.suggest_tags_button')}
                    </Button>
                    <div className="flex flex-wrap gap-2 items-center">
                        {suggestedTags.map(tag => (
                           <Button type="button" size="sm" variant="outline" key={tag} onClick={() => addTag(tag)} disabled={isSubmitting}>
                                + {tag}
                           </Button>
                        ))}
                    </div>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : t('event_submission.submit_button')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
