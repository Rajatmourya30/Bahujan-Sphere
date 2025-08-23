
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
import { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';
import { KNOWLEDGE_HUB_CATEGORIES } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  websiteUrl: z.string().min(1, 'Website URL is required').url('Must be a valid URL'),
  categoryKey: z.string().min(1, 'Category is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageOrganizationDialogProps {
  organization: KnowledgeOrganization | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<KnowledgeOrganization, 'id' | 'logoUrl' | 'nameKey' | 'descriptionKey'>, newImageFile?: File) => void;
}

export function ManageOrganizationDialog({ organization, onOpenChange, onSave }: ManageOrganizationDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(organization?.logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || '',
      description: organization?.description || '',
      websiteUrl: organization?.websiteUrl || '',
      categoryKey: organization?.categoryKey || '',
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
    const selectedCategory = KNOWLEDGE_HUB_CATEGORIES.find(c => c.key === values.categoryKey);
    const data = {
        ...values,
        category: selectedCategory ? selectedCategory.label : values.categoryKey,
    }
    onSave(data, imageFile || undefined);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ambedkar Institute" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. A brief description of the organization." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="categoryKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {KNOWLEDGE_HUB_CATEGORIES.map((category) => (
                        <SelectItem key={category.key} value={category.key}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
              <FormLabel>Logo Image</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image
                    src={imagePreview || 'https://placehold.co/400x400.png'}
                    alt="Logo preview"
                    fill
                    sizes="80px"
                    className="object-contain rounded-md border p-1"
                  />
                </div>
                <div className="flex-grow">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload New Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a new logo to replace the existing one.
                  </p>
                </div>
              </div>
            </FormItem>
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
