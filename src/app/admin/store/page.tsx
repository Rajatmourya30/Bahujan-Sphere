
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { BahujanStore } from '@/lib/store';
import { StoreDirectoryTable } from '@/components/admin/StoreDirectoryTable';
import { ManageStoreDialog } from '@/components/admin/ManageStoreDialog';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ManageStorePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<BahujanStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<BahujanStore | null>(null);

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
    const q = query(collection(db, 'stores'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BahujanStore));
      setStores(fetchedStores);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching stores:", error);
      toast({ title: 'Error', description: 'Could not fetch stores.', variant: 'destructive' });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, toast]);
  
  const handleOpenDialog = (store: BahujanStore | null = null) => {
    setEditingStore(store);
    setIsDialogOpen(true);
  };
  
  const handleSave = async (storeData: Omit<BahujanStore, 'id' | 'imageUrl'>, newImageFile?: File) => {
    try {
        if (editingStore) { // Editing existing store
            let newImageUrl = editingStore.imageUrl;
            let newImageStoragePath = editingStore.imageStoragePath;
            
            if (newImageFile) {
                if (editingStore.imageStoragePath) {
                    const oldImageRef = ref(storage, editingStore.imageStoragePath);
                    await deleteObject(oldImageRef).catch(err => console.error("Old image delete failed:", err));
                }
                const newImageRef = ref(storage, `images/stores/${Date.now()}-${newImageFile.name}`);
                const uploadResult = await uploadBytes(newImageRef, newImageFile);
                newImageUrl = await getDownloadURL(uploadResult.ref);
                newImageStoragePath = newImageRef.fullPath;
            }

            await updateDoc(doc(db, 'stores', editingStore.id), {
                ...storeData,
                imageUrl: newImageUrl,
                imageStoragePath: newImageStoragePath
            });
            toast({ title: 'Store Updated', description: 'The store has been successfully updated.' });
        } else { // Adding new store
             if (!newImageFile) {
                toast({ title: 'Image Required', description: 'Please provide an image for the new store.', variant: 'destructive' });
                return;
            }
            const newImageRef = ref(storage, `images/stores/${Date.now()}-${newImageFile.name}`);
            const uploadResult = await uploadBytes(newImageRef, newImageFile);
            const newImageUrl = await getDownloadURL(uploadResult.ref);
            
            await addDoc(collection(db, 'stores'), {
                ...storeData,
                imageUrl: newImageUrl,
                imageStoragePath: newImageRef.fullPath,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Store Added', description: 'The new store has been successfully added.' });
        }
    } catch (error) {
        console.error('Error updating store:', error);
        toast({ title: 'Error', description: 'Could not update the store.', variant: 'destructive' });
    }
  };

  const handleRemove = async (storeId: string) => {
    try {
        await deleteDoc(doc(db, "stores", storeId));
        toast({ title: "Store Removed", description: "The store has been successfully deleted." });
    } catch (error) {
        console.error("Error removing store: ", error);
        toast({ title: "Error", description: "There was a problem deleting the store.", variant: "destructive" });
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
      <header className="flex justify-between items-center">
        <div>
            <h1 className="font-headline text-3xl font-bold">Manage Store Directory</h1>
            <p className="text-muted-foreground">Add, edit, or remove stores.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2" />
            Add Store
        </Button>
      </header>

      <StoreDirectoryTable
        stores={stores}
        onEdit={handleOpenDialog}
        onRemove={handleRemove}
      />

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
