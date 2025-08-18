
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { TeamMember, TeamMemberTable } from '@/components/admin/TeamMemberTable';
import { AddMemberDialog } from '@/components/admin/AddMemberDialog';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { NewTeamMember, TeamMemberWithId } from '@/lib/team';

export default function TeamManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

    const q = query(collection(db, "teamMembers"), orderBy("joinedAt", "desc"));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeamMemberWithId));
      setTeamMembers(members);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching team members:", error);
      toast({ title: 'Error', description: 'Could not fetch team members.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [user, toast]);

  const handleUpdateRole = async (memberId: string, newRole: TeamMember['role']) => {
    const memberDocRef = doc(db, 'teamMembers', memberId);
    try {
      await updateDoc(memberDocRef, { role: newRole });
      toast({ title: 'Success', description: 'Team member role updated.' });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: 'Error', description: 'Failed to update role.', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const memberDocRef = doc(db, 'teamMembers', memberId);
    try {
      await deleteDoc(memberDocRef);
      toast({ title: 'Success', description: 'Team member removed.' });
    } catch (error) {
      console.error("Error removing member:", error);
      toast({ title: 'Error', description: 'Failed to remove team member.', variant: 'destructive' });
    }
  };

  const handleAddMember = async (newMember: NewTeamMember) => {
    try {
      await addDoc(collection(db, 'teamMembers'), {
        ...newMember,
        joinedAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'New team member added and their login has been created.' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding member to Firestore:", error);
      toast({ 
          title: 'Error Saving Member Details', 
          description: 'The user login was created, but their details could not be saved to the database.', 
          variant: 'destructive' 
      });
    }
  };


  if (isLoading) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold">Team Management</h1>
                <p className="text-muted-foreground">Add and manage your team members in Firestore.</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Member
            </Button>
      </header>
      
      <section>
        <TeamMemberTable
          members={teamMembers}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
        />
      </section>

      {isAddDialogOpen && (
        <AddMemberDialog
          onOpenChange={setIsAddDialogOpen}
          onSave={handleAddMember}
        />
      )}
    </div>
  );
}
