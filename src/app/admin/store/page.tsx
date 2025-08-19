
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BahujanStore } from '@/lib/store';
import { StoreDirectoryTable } from '@/components/admin/StoreDirectoryTable';
import { StoreSubmissionForm } from '@/components/admin/submissions/StoreSubmissionForm';
import { ReviewStoreSubmissionsTab } from '@/components/admin/review/ReviewStoreSubmissionsTab';
import { ManageStoreDialog } from '@/components/admin/ManageStoreDialog';

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
    const q = query(collection(db, 'stores'), where('status', '==', 'approved'));
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
  
  const handleSave = (storeData: Omit<BahujanStore, 'id'>) => {
    console.log("Saving store (not implemented):", storeData);
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
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Store Directory</h1>
        <p className="text-muted-foreground">Add, edit, or remove stores.</p>
      </header>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
           <TabsTrigger value="manage">Manage Stores</TabsTrigger>
           <TabsTrigger value="single-store">Submit Store</TabsTrigger>
           <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
            <StoreDirectoryTable
              stores={stores}
              onEdit={handleOpenDialog}
              onRemove={handleRemove}
            />
        </TabsContent>
        
        <TabsContent value="single-store" className="mt-6">
          <StoreSubmissionForm />
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
