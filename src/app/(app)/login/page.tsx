'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

export default function UserLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    // In a real app, you'd have proper authentication.
    // Here, we'll check for the user in localStorage.
    const storedUser = localStorage.getItem('bahujanUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.email === email && user.password === password) {
            localStorage.setItem('isUserAuthenticated', 'true');
            router.push('/profile');
            return;
        }
    }
    
    toast({
        title: t('login_page.toast_failed_title'),
        description: t('login_page.toast_failed_description'),
        variant: 'destructive',
    });
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('login_page.title')}</CardTitle>
          <CardDescription>{t('login_page.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login_page.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login_page.password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              {t('login_page.login_button')}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm">
            {t('login_page.signup_prompt')}&nbsp;
            <Link href="/signup" className="underline">
                {t('login_page.signup_link')}
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
