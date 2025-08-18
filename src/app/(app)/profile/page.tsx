
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, LogOut, Palette, Heart, Trash2, Camera, X } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { DonationDialog } from '@/components/profile/DonationDialog';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface UserProfile {
    name: string;
    email: string;
    country: string;
    state: string;
    city: string;
    birthYear: number;
    photoUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(docSnap.data() as UserProfile);
        } else {
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const firebaseUser = auth.currentUser;
    if (!file || !firebaseUser) return;

    const storageRef = ref(storage, `profile-pictures/${firebaseUser.uid}`);
    setUploadProgress(0);

    try {
        if (user?.photoUrl) {
            const oldPhotoRef = ref(storage, user.photoUrl);
            await deleteObject(oldPhotoRef).catch(err => console.log("Old photo not found, skipping delete.", err));
        }

        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
        });
        
        // This is a simplified progress simulation, as uploadBytes doesn't provide progress.
        // For real progress, you would use uploadBytesResumable.
        setUploadProgress(100); 

        const downloadURL = await getDownloadURL(snapshot.ref);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, { photoUrl: downloadURL });
        
        setUser(prevUser => prevUser ? { ...prevUser, photoUrl: downloadURL } : null);

        toast({ title: "Profile Picture Updated", description: "Your new photo has been saved." });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        toast({ title: "Upload Failed", description: "Could not upload your profile picture.", variant: "destructive" });
    } finally {
        setTimeout(() => setUploadProgress(null), 1000);
    }
  };
  
  const handleRemovePhoto = async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !user?.photoUrl) return;
      
      try {
          const photoRef = ref(storage, user.photoUrl);
          await deleteObject(photoRef);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userDocRef, { photoUrl: '' });
          
          setUser(prevUser => prevUser ? { ...prevUser, photoUrl: '' } : null);
          toast({ title: "Profile Picture Removed" });
      } catch (error) {
          console.error("Error removing profile picture:", error);
          toast({ title: "Removal Failed", description: "Could not remove your profile picture.", variant: "destructive" });
      }
  };

  const handleDeleteAccount = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
        toast({ title: 'Error', description: 'No user is currently signed in.', variant: 'destructive' });
        return;
    }

    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await deleteDoc(userDocRef);
        await deleteUser(firebaseUser);
        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
        router.push('/signup');
    } catch (error: any) {
        console.error('Error deleting account:', error);
        let description = 'An error occurred while deleting your account.';
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
                        <div className="relative group">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={user.photoUrl} alt={user.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera />
                                </Button>
                                {user.photoUrl && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20"
                                        onClick={handleRemovePhoto}
                                    >
                                        <X />
                                    </Button>
                                )}
                            </div>
                        </div>
                        {uploadProgress !== null && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}

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
                    <CardFooter className="flex justify-between items-center">
                        <Button onClick={() => setIsDeleteDialogOpen(true)} variant="link" size="sm" className="text-destructive hover:text-destructive/80">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                        </Button>
                        <Button onClick={handleLogout} variant="outline">
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('profile_page.logout_button')}
                        </Button>
                    </CardFooter>
                </Card>

                <Button onClick={() => setIsDonationDialogOpen(true)} size="lg" className="w-full">
                    <Heart className="mr-2" />
                    {t('profile_page.support_button')}
                </Button>
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

    