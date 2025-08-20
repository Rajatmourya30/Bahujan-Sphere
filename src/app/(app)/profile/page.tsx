
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, LogOut, Palette, Heart, Trash2, Camera, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { DonationDialog } from '@/components/profile/DonationDialog';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, signOut, deleteUser, type User } from 'firebase/auth';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


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
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfile(profileData);
          setPhotoPreview(profileData.photoUrl || null);
        }
        setIsLoading(false);
      } else {
        router.replace('/login');
      }
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
      if (!photoFile || !firebaseUser) return;

      setIsUploading(true);
      try {
          const fileName = `${firebaseUser.uid}_${Date.now()}_${photoFile.name}`;
          const storageRef = ref(storage, `profilePictures/${firebaseUser.uid}/${fileName}`);
          await uploadBytes(storageRef, photoFile);
          const newPhotoUrl = await getDownloadURL(storageRef);

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userDocRef, { photoUrl: newPhotoUrl });
          
          setUserProfile(prev => prev ? { ...prev, photoUrl: newPhotoUrl } : null);
          setPhotoFile(null);

          toast({ title: 'Success', description: 'Your profile picture has been updated.' });

      } catch (error) {
          console.error("Error uploading photo:", error);
          toast({ title: 'Upload Failed', description: 'Could not update your profile picture. Please check storage rules in the Firebase Console.', variant: 'destructive' });
      } finally {
          setIsUploading(false);
      }
  };


  if (isLoading || !userProfile) {
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
                            <Avatar
                                className="h-24 w-24 mb-4 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <AvatarImage src={photoPreview || undefined} alt={userProfile.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                                    {userProfile.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                        {photoFile && (
                            <Button onClick={handlePhotoUpload} disabled={isUploading} size="sm" className="mb-2">
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Picture
                            </Button>
                        )}
                        
                        <div>
                            <CardTitle className="text-2xl font-headline">{userProfile.name}</CardTitle>
                            <CardDescription>{userProfile.email}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="space-y-4">
                             <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.city')}</p>
                                <p>{userProfile.city}</p>
                            </div>
                             <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.state')}</p>
                                <p>{userProfile.state}</p>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.country')}</p>
                                <p>{userProfile.country}</p>
                            </div>
                             <div>
                                <p className="font-medium text-muted-foreground">{t('profile_page.birth_year')}</p>
                                <p>{userProfile.birthYear}</p>
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
                        <Button onClick={() => setIsDeleteDialogOpen(true)} variant="link" size="sm" className="text-destructive dark:text-red-500 hover:text-destructive/80 dark:hover:text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                        </Button>
                        <Button onClick={handleLogout} variant="outline">
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('profile_page.logout_button')}
                        </Button>
                    </CardFooter>
                </Card>

                <Button onClick={() => setIsDonationDialogOpen(true)} size="lg" className="w-full group">
                    <Heart className="mr-2 transition-colors group-hover:fill-red-500 group-hover:text-red-500 animate-in group-hover:scale-110" />
                    {t('profile_page.support_button')}
                </Button>
            </div>
        </div>
        
        {isDonationDialogOpen && (
            <DonationDialog
                isOpen={isDonationDialogOpen}
                onOpenChange={setIsDonationDialogOpen}
                userName={userProfile.name}
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
