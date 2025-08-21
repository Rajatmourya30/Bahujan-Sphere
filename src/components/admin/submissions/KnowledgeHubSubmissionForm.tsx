
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Image from 'next/image';

const formSchema = z.object({
  nameKey: z.string().min(1, 'Key is required'),
  descriptionKey: z.string().min(1, 'Key is required'),
  categoryKey: z.string().min(1, 'Category key is required'),
  logoFile: z.instanceof(File, { message: 'A logo image is required.' }).refine(file => file.size > 0, 'A logo image is required.'),
  websiteUrl: z.string().url('Must be a valid URL'),
});

export function KnowledgeHubSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'teamMembers', currentUser.uid);
         try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role);
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameKey: '',
      descriptionKey: '',
      categoryKey: '',
      websiteUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!user) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const canPublishDirectly = userRole === 'Admin' || userRole === 'Manager';
    const collectionName = canPublishDirectly ? 'knowledgeHub' : 'knowledgeHubSubmissions';
    const status = canPublishDirectly ? 'approved' : 'pending';

    try {
      const imageRef = ref(storage, `images/logos/${Date.now()}-${values.logoFile.name}`);
      const uploadResult = await uploadBytes(imageRef, values.logoFile);
      const logoUrl = await getDownloadURL(uploadResult.ref);

      const dataToSave: any = {
        nameKey: values.nameKey,
        descriptionKey: values.descriptionKey,
        categoryKey: values.categoryKey,
        category: values.categoryKey.split('_').pop(), // Simple conversion from key
        websiteUrl: values.websiteUrl,
        logoUrl: logoUrl,
        logoStoragePath: imageRef.fullPath,
        status: status,
      };

      if (canPublishDirectly) {
        dataToSave.approvedBy = user.uid;
        dataToSave.approvedAt = serverTimestamp();
      } else {
        dataToSave.submittedBy = user.uid;
        dataToSave.submittedAt = serverTimestamp();
        dataToSave.title = values.nameKey; // for display in review table
      }

      await addDoc(collection(db, collectionName), dataToSave);

      toast({ 
        title: canPublishDirectly ? "Organization Published!" : "Organization Submitted!",
        description: canPublishDirectly ? "The organization is now live." : "The organization is now pending review."
      });
      form.reset();
      setImagePreview(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error submitting organization:", error);
      toast({ title: "Submission Failed", description: "An error occurred during submission.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a New Organization</CardTitle>
        <CardDescription>Enter the details for a new organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nameKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name Key</FormLabel>
                  <FormControl><Input placeholder="e.g., org_new_name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="descriptionKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Key</FormLabel>
                  <FormControl><Textarea placeholder="e.g., org_new_desc" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="categoryKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Key</FormLabel>
                  <FormControl><Input placeholder="e.g., category_political" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField
              control={form.control}
              name="logoFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </FormControl>
                  {imagePreview && <Image src={imagePreview} alt="Image preview" width={80} height={80} className="mt-2 rounded-md border object-contain p-1" />}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userRole === 'Admin' || userRole === 'Manager' ? 'Publish Directly' : 'Submit for Review'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
