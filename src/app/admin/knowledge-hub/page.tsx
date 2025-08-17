
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { allKnowledgeOrganizations, KnowledgeOrganization } from '@/lib/knowledge-hub';
import { KnowledgeHubTable } from '@/components/admin/KnowledgeHubTable';
import { ManageOrganizationDialog } from '@/components/admin/ManageOrganizationDialog';

export default function ManageKnowledgeHubPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [organizations, setOrganizations] = useState(allKnowledgeOrganizations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<KnowledgeOrganization | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleOpenDialog = (org: KnowledgeOrganization | null = null) => {
    setEditingOrg(org);
    setIsDialogOpen(true);
  };
  
  const handleSave = (orgData: Omit<KnowledgeOrganization, 'id'>) => {
    if (editingOrg) {
      setOrganizations(orgs => orgs.map(o => o.id === editingOrg.id ? { ...o, ...orgData } : o));
    } else {
      setOrganizations(orgs => [...orgs, { ...orgData, id: `org-${Date.now()}` }]);
    }
  };

  const handleRemove = (orgId: string) => {
    setOrganizations(orgs => orgs.filter(o => o.id !== orgId));
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
          <h1 className="font-headline text-3xl font-bold">Manage Knowledge Hub</h1>
          <p className="text-muted-foreground">Add, edit, or remove organizations.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </header>

      <section>
        <KnowledgeHubTable
          organizations={organizations}
          onEdit={handleOpenDialog}
          onRemove={handleRemove}
        />
      </section>

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
