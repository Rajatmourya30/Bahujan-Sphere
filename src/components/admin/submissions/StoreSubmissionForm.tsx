
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
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';

const formSchema = z.object({
  nameKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageUrl: z.string().url('Must be a valid URL'),
  storeUrl: z.string().url('Must be a valid URL'),
  imageAiHint: z.string().min(1, 'AI Hint is required'),
});

export function StoreSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
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
      nameKey: '',
      descriptionKey: '',
      imageUrl: '',
      storeUrl: '',
      imageAiHint: 'store logo',
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
      await addDoc(collection(db, "storeSubmissions"), {
        ...values,
        title: values.nameKey,
        submittedBy: user.uid,
        submittedAt: serverTimestamp(),
        status: 'pending',
      });
      toast({ title: "Store Submitted!", description: "The store is now pending review." });
      form.reset();
    } catch (error) {
      console.error("Error submitting store:", error);
      toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a New Store</CardTitle>
        <CardDescription>Enter the details for a new store to be added to the directory.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nameKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name Key</FormLabel>
                  <FormControl><Input placeholder="e.g., store_new_name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="descriptionKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Key</FormLabel>
                  <FormControl><Textarea placeholder="e.g., store_new_desc" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://placehold.co/400x400.png" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="storeUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Store URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com/store" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="imageAiHint" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image AI Hint</FormLabel>
                  <FormControl><Input placeholder="e.g., store logo" {...field} /></FormControl>
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
