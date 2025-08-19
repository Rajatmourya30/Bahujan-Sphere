
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useRef } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Image from 'next/image';

const formSchema = z.object({
  titleKey: z.string().min(1, 'Key is required'),
  authorKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  imageFile: z.instanceof(File, { message: 'An image is required.' }).refine(file => file.size > 0, 'An image is required.'),
  affiliateUrl: z.string().url('Must be a valid URL'),
});

export function BookSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      affiliateUrl: '',
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
      // 1. Upload image to Storage
      const imageRef = ref(storage, `images/books/${Date.now()}-${values.imageFile.name}`);
      const uploadResult = await uploadBytes(imageRef, values.imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Add document to Firestore
      await addDoc(collection(db, "bookSubmissions"), {
        titleKey: values.titleKey,
        authorKey: values.authorKey,
        descriptionKey: values.descriptionKey,
        affiliateUrl: values.affiliateUrl,
        imageUrl: imageUrl,
        imageStoragePath: imageRef.fullPath,
        title: values.titleKey, // for display in review table
        submittedBy: user.uid,
        submittedAt: serverTimestamp(),
        status: 'pending',
      });
      toast({ title: "Book Submitted!", description: "The book is now pending review." });
      form.reset();
      setImagePreview(null);
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
             <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </FormControl>
                  {imagePreview && <Image src={imagePreview} alt="Image preview" width={80} height={120} className="mt-2 rounded-md border" />}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="affiliateUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliate URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com/product-link" {...field} /></FormControl>
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
