'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Globe, LogOut } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Label } from '@/components/ui/label';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isUserAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/login');
    } else {
      const storedUser = localStorage.getItem('bahujanUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isUserAuthenticated');
    localStorage.removeItem('bahujanUser');
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-medium text-muted-foreground">{t('profile_page.country')}</p>
                        <p>{user.country}</p>
                    </div>
                     <div>
                        <p className="font-medium text-muted-foreground">{t('profile_page.state')}</p>
                        <p>{user.state}</p>
                    </div>
                     <div>
                        <p className="font-medium text-muted-foreground">{t('profile_page.city')}</p>
                        <p>{user.city}</p>
                    </div>
                     <div>
                        <p className="font-medium text-muted-foreground">{t('profile_page.birth_year')}</p>
                        <p>{user.birthYear}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">{t('profile_page.settings_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <span>{t('profile_page.language_label')}</span>
                    </Label>
                    <LanguageSwitcher />
                </div>
            </CardContent>
        </Card>

        <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            {t('profile_page.logout_button')}
        </Button>
    </div>
  );
}
