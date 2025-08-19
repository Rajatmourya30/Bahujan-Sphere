
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { KnowledgeOrganization } from '@/lib/knowledge-hub';
import { KnowledgeHubTable } from '@/components/admin/KnowledgeHubTable';
import { ManageOrganizationDialog } from '@/components/admin/ManageOrganizationDialog';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ManageKnowledgeHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<KnowledgeOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<KnowledgeOrganization | null>(null);

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
    const q = query(collection(db, 'knowledgeHub'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeOrganization));
      setOrganizations(fetchedOrgs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching organizations:", error);
      toast({ title: 'Error', description: 'Could not fetch organizations.', variant: 'destructive' });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, toast]);
  
  const handleOpenDialog = (org: KnowledgeOrganization | null = null) => {
    setEditingOrg(org);
    setIsDialogOpen(true);
  };
  
  const handleSave = async (orgData: Omit<KnowledgeOrganization, 'id' | 'logoUrl'>, newImageFile?: File) => {
    try {
        if (editingOrg) { // Editing existing org
            let newLogoUrl = editingOrg.logoUrl;
            let newLogoStoragePath = editingOrg.logoStoragePath;
            
            if (newImageFile) {
                if (editingOrg.logoStoragePath) {
                    const oldImageRef = ref(storage, editingOrg.logoStoragePath);
                    await deleteObject(oldImageRef).catch(err => console.error("Old image delete failed:", err));
                }
                const newImageRef = ref(storage, `images/logos/${Date.now()}-${newImageFile.name}`);
                const uploadResult = await uploadBytes(newImageRef, newImageFile);
                newLogoUrl = await getDownloadURL(uploadResult.ref);
                newLogoStoragePath = newImageRef.fullPath;
            }

            await updateDoc(doc(db, 'knowledgeHub', editingOrg.id), {
                ...orgData,
                logoUrl: newLogoUrl,
                logoStoragePath: newLogoStoragePath
            });
            toast({ title: 'Organization Updated', description: 'The organization has been successfully updated.' });
        } else { // Adding new org
            if (!newImageFile) {
                toast({ title: 'Image Required', description: 'Please provide a logo for the new organization.', variant: 'destructive' });
                return;
            }
            const newImageRef = ref(storage, `images/logos/${Date.now()}-${newImageFile.name}`);
            const uploadResult = await uploadBytes(newImageRef, newImageFile);
            const newLogoUrl = await getDownloadURL(uploadResult.ref);

            await addDoc(collection(db, 'knowledgeHub'), {
                ...orgData,
                logoUrl: newLogoUrl,
                logoStoragePath: newImageRef.fullPath,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Organization Added', description: 'The new organization has been successfully added.' });
        }
    } catch (error) {
        console.error('Error saving organization:', error);
        toast({ title: 'Error', description: 'Could not save the organization.', variant: 'destructive' });
    }
  };

  const handleRemove = async (orgId: string) => {
    try {
        await deleteDoc(doc(db, "knowledgeHub", orgId));
        toast({ title: "Organization Removed", description: "The organization has been successfully deleted." });
    } catch (error) {
        console.error("Error removing organization: ", error);
        toast({ title: "Error", description: "There was a problem deleting the organization.", variant: "destructive" });
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
          <h1 className="font-headline text-3xl font-bold">Manage Knowledge Hub</h1>
          <p className="text-muted-foreground">Add, edit, or remove organizations.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2" />
            Add Organization
        </Button>
      </header>

      <KnowledgeHubTable
        organizations={organizations}
        onEdit={handleOpenDialog}
        onRemove={handleRemove}
      />

      {isDialogOpen && (
        <ManageOrganizationDialog
          organization={editingOrg}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
