
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  imageAiHint: z.string().min(1, 'AI Hint is required'),
});

export function BookSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      titleKey: '',
      authorKey: '',
      descriptionKey: '',
      imageUrl: '',
      affiliateUrl: '',
      imageAiHint: 'book cover',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!user) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, "bookSubmissions"), {
        ...values,
        title: values.titleKey, // for display in review table
        submittedBy: user.uid,
        submittedAt: serverTimestamp(),
        status: 'pending',
      });
      toast({ title: "Book Submitted!", description: "The book is now pending review." });
      form.reset();
    } catch (error) {
      console.error("Error submitting book:", error);
      toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a New Book</CardTitle>
        <CardDescription>Enter the details for a new book to be added to the directory.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="titleKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title Key</FormLabel>
                  <FormControl><Input placeholder="e.g., book_my_life_title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="authorKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Key</FormLabel>
                  <FormControl><Input placeholder="e.g., book_my_life_author" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="descriptionKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Key</FormLabel>
                  <FormControl><Textarea placeholder="e.g., book_my_life_desc" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://placehold.co/400x600.png" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="affiliateUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliate URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com/product-link" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="imageAiHint" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image AI Hint</FormLabel>
                  <FormControl><Input placeholder="e.g., book cover" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
