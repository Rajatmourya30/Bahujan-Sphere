
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Globe, LogOut, Palette, Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { DonationDialog } from '@/components/profile/DonationDialog';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);

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

                <Button onClick={handleLogout} variant="outline" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('profile_page.logout_button')}
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
    </>
  );
}
