
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Globe, LogOut, Palette, Heart, Trash2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { DonationDialog } from '@/components/profile/DonationDialog';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    name: string;
    email: string;
    country: string;
    state: string;
    city: string;
    birthYear: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(docSnap.data() as UserProfile);
        } else {
          // Handle case where user exists in Auth but not Firestore
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const handleDeleteAccount = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
        toast({ title: 'Error', description: 'No user is currently signed in.', variant: 'destructive' });
        return;
    }

    try {
        // First, delete the Firestore document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await deleteDoc(userDocRef);

        // Then, delete the user from Firebase Auth
        await deleteUser(firebaseUser);

        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
        router.push('/signup'); // Redirect to signup or home page
    } catch (error: any) {
        console.error('Error deleting account:', error);
        let description = 'An error occurred while deleting your account.';
        // This error often means the user needs to re-authenticate
        if (error.code === 'auth/requires-recent-login') {
            description = 'This is a sensitive operation. Please log out and log back in before deleting your account.';
        }
        toast({ title: 'Deletion Failed', description, variant: 'destructive' });
    } finally {
        setIsDeleteDialogOpen(false);
    }
  };


  if (isLoading || !user) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
  }

  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                                {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="space-y-4">
                             <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.city')}</p>
                                <p>{user.city}</p>
                            </div>
                             <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.state')}</p>
                                <p>{user.state}</p>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.country')}</p>
                                <p>{user.country}</p>
                            </div>
                             <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.birth_year')}</p>
                                <p>{user.birthYear}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-headline">{t('profile_page.settings_title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                <span>{t('profile_page.language_label')}</span>
                            </Label>
                            <LanguageSwitcher />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-muted-foreground" />
                                <span>Theme</span>
                            </Label>
                            <ThemeSwitcher />
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={() => setIsDonationDialogOpen(true)} size="lg" className="w-full">
                    <Heart className="mr-2" />
                    {t('profile_page.support_button')}
                </Button>

                <div className="space-y-2">
                    <Button onClick={handleLogout} variant="outline" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('profile_page.logout_button')}
                    </Button>
                     <Button onClick={() => setIsDeleteDialogOpen(true)} variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
        
        {isDonationDialogOpen && (
            <DonationDialog
                isOpen={isDonationDialogOpen}
                onOpenChange={setIsDonationDialogOpen}
                userName={user.name}
            />
        )}
        {isDeleteDialogOpen && (
            <DeleteAccountDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteAccount}
            />
        )}
    </>
  );
}
