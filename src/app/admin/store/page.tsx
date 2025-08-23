
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreSubmissionForm } from '@/components/admin/submissions/StoreSubmissionForm';
import { ReviewStoreSubmissionsTab } from '@/components/admin/review/ReviewStoreSubmissionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreBulkUpload } from '@/components/admin/submissions/StoreBulkUpload';
import { StoreStatsDashboard } from '@/components/admin/StoreStatsDashboard';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import type { BahujanStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { StoreDirectoryTable } from '@/components/admin/StoreDirectoryTable';
import { ManageStoreDialog } from '@/components/admin/ManageStoreDialog';

export default function ManageStorePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<BahujanStore[]>([]);
  const [editingStore, setEditingStore] = useState<BahujanStore | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'stores'), where('status', '==', 'approved'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BahujanStore));
        setStores(fetchedStores);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch stores:", error);
        toast({ title: 'Error', description: 'Could not fetch stores.', variant: 'destructive' });
        setIsLoading(false);
    });
    return () => unsubscribeFirestore();
  }, [user, toast]);

  const handleOpenDialog = (store: BahujanStore | null = null) => {
    setEditingStore(store);
    setIsDialogOpen(true);
  };

  const handleRemove = async (storeId: string) => {
      if (!window.confirm("Are you sure you want to delete this store?")) return;
      try {
          const storeToDelete = stores.find(s => s.id === storeId);
          if (storeToDelete?.imageStoragePath) {
              await deleteObject(ref(storage, storeToDelete.imageStoragePath));
          }
          await deleteDoc(doc(db, 'stores', storeId));
          toast({ title: 'Success', description: 'Store deleted.' });
      } catch (error) {
          console.error("Error removing store:", error);
          toast({ title: 'Error', description: 'Could not delete store.', variant: 'destructive' });
      }
  };

  const handleSave = async (data: Omit<BahujanStore, 'id' | 'imageUrl'>, newImageFile?: File) => {
      if (!editingStore) return;
      try {
          let imageUrl = editingStore.imageUrl;
          let imageStoragePath = editingStore.imageStoragePath || '';

          if (newImageFile) {
              if (editingStore.imageStoragePath) {
                  await deleteObject(ref(storage, editingStore.imageStoragePath));
              }
              const imageRef = ref(storage, `images/stores/${Date.now()}-${newImageFile.name}`);
              await uploadBytes(imageRef, newImageFile);
              imageUrl = await getDownloadURL(imageRef);
              imageStoragePath = imageRef.fullPath;
          }
          
          await updateDoc(doc(db, 'stores', editingStore.id), {
              ...data,
              imageUrl,
              imageStoragePath,
          });
          toast({ title: 'Success', description: 'Store updated.' });
      } catch (error) {
          console.error("Error saving store:", error);
          toast({ title: 'Error', description: 'Could not save store.', variant: 'destructive' });
      }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
          <h1 className="font-headline text-3xl font-bold">Manage Store Directory</h1>
          <p className="text-muted-foreground">Manage, submit, or review stores.</p>
      </header>

      <StoreStatsDashboard />

       <Tabs defaultValue="manage">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="submit">Submit Single</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
            <StoreDirectoryTable
                stores={stores}
                onEdit={handleOpenDialog}
                onRemove={handleRemove}
            />
        </TabsContent>
        <TabsContent value="submit" className="mt-6">
            <StoreSubmissionForm />
        </TabsContent>
        <TabsContent value="bulk-upload" className="mt-6">
            <StoreBulkUpload />
        </TabsContent>
         <TabsContent value="review" className="mt-6">
            <ReviewStoreSubmissionsTab currentUser={user} />
        </TabsContent>
      </Tabs>

       {isDialogOpen && (
        <ManageStoreDialog
            store={editingStore}
            onOpenChange={setIsDialogOpen}
            onSave={handleSave}
        />
      )}
    </div>
  );
}
