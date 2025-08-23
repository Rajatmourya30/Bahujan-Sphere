
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { KnowledgeHubSubmissionForm } from '@/components/admin/submissions/KnowledgeHubSubmissionForm';
import { ReviewKnowledgeHubSubmissionsTab } from '@/components/admin/review/ReviewKnowledgeHubSubmissionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeHubBulkUpload } from '@/components/admin/submissions/KnowledgeHubBulkUpload';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import type { KnowledgeOrganization } from '@/lib/knowledge-hub';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeHubTable } from '@/components/admin/KnowledgeHubTable';
import { ManageOrganizationDialog } from '@/components/admin/ManageOrganizationDialog';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { KnowledgeHubStatsDashboard } from '@/components/admin/KnowledgeHubStatsDashboard';

export default function ManageKnowledgeHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<KnowledgeOrganization[]>([]);
  const [editingOrg, setEditingOrg] = useState<KnowledgeOrganization | null>(null);
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
    const q = query(collection(db, 'knowledgeHub'), where('status', '==', 'approved'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedOrgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeOrganization));
        setOrganizations(fetchedOrgs);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch organizations:", error);
        toast({ title: 'Error', description: 'Could not fetch organizations.', variant: 'destructive' });
        setIsLoading(false);
    });
    return () => unsubscribeFirestore();
  }, [user, toast]);

  const handleOpenDialog = (org: KnowledgeOrganization | null = null) => {
    setEditingOrg(org);
    setIsDialogOpen(true);
  };

  const handleRemove = async (orgId: string) => {
      if (!window.confirm("Are you sure you want to delete this organization?")) return;
      try {
          const orgToDelete = organizations.find(o => o.id === orgId);
          if (orgToDelete?.logoStoragePath) {
              await deleteObject(ref(storage, orgToDelete.logoStoragePath));
          }
          await deleteDoc(doc(db, 'knowledgeHub', orgId));
          toast({ title: 'Success', description: 'Organization deleted.' });
      } catch (error) {
          console.error("Error removing organization:", error);
          toast({ title: 'Error', description: 'Could not delete organization.', variant: 'destructive' });
      }
  };

  const handleSave = async (data: Omit<KnowledgeOrganization, 'id' | 'logoUrl'>, newImageFile?: File) => {
      if (!editingOrg) return;
      try {
          let logoUrl = editingOrg.logoUrl;
          let logoStoragePath = editingOrg.logoStoragePath || '';

          if (newImageFile) {
              if (editingOrg.logoStoragePath) {
                  await deleteObject(ref(storage, editingOrg.logoStoragePath));
              }
              const imageRef = ref(storage, `images/logos/${Date.now()}-${newImageFile.name}`);
              await uploadBytes(imageRef, newImageFile);
              logoUrl = await getDownloadURL(imageRef);
              logoStoragePath = imageRef.fullPath;
          }
          
          await updateDoc(doc(db, 'knowledgeHub', editingOrg.id), {
              ...data,
              logoUrl,
              logoStoragePath,
          });
          toast({ title: 'Success', description: 'Organization updated.' });
      } catch (error) {
          console.error("Error saving organization:", error);
          toast({ title: 'Error', description: 'Could not save organization.', variant: 'destructive' });
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
          <h1 className="font-headline text-3xl font-bold">Manage Knowledge Hub</h1>
          <p className="text-muted-foreground">Manage, submit, or review organizations.</p>
      </header>

      <KnowledgeHubStatsDashboard />

      <Tabs defaultValue="manage">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="submit">Submit Single</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
            <KnowledgeHubTable
                organizations={organizations}
                onEdit={handleOpenDialog}
                onRemove={handleRemove}
            />
        </TabsContent>
        <TabsContent value="submit" className="mt-6">
            <KnowledgeHubSubmissionForm />
        </TabsContent>
        <TabsContent value="bulk-upload" className="mt-6">
            <KnowledgeHubBulkUpload />
        </TabsContent>
         <TabsContent value="review" className="mt-6">
            <ReviewKnowledgeHubSubmissionsTab currentUser={user} />
        </TabsContent>
      </Tabs>

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
