
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { allBahujanStores, BahujanStore } from '@/lib/store';
import { StoreDirectoryTable } from '@/components/admin/StoreDirectoryTable';
import { ManageStoreDialog } from '@/components/admin/ManageStoreDialog';

export default function ManageStorePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stores, setStores] = useState(allBahujanStores);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<BahujanStore | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleOpenDialog = (store: BahujanStore | null = null) => {
    setEditingStore(store);
    setIsDialogOpen(true);
  };
  
  const handleSave = (storeData: Omit<BahujanStore, 'id'>) => {
    if (editingStore) {
      setStores(currentStores => currentStores.map(s => s.id === editingStore.id ? { ...s, ...storeData } : s));
    } else {
      setStores(currentStores => [...currentStores, { ...storeData, id: `store-${Date.now()}` }]);
    }
  };

  const handleRemove = (storeId: string) => {
    setStores(currentStores => currentStores.filter(s => s.id !== storeId));
  };

  if (!isAuthenticated) {
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
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-4">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="font-headline text-3xl font-bold">Manage Store Directory</h1>
          <p className="text-muted-foreground">Add, edit, or remove stores.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Store
        </Button>
      </header>

      <section>
        <StoreDirectoryTable
          stores={stores}
          onEdit={handleOpenDialog}
          onRemove={handleRemove}
        />
      </section>

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
