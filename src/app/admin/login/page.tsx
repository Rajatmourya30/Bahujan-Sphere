'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    // In a real app, you'd have proper authentication.
    // Here, we'll use a simple check.
    if (password === 'admin123') {
      // Simulate a session by storing a value in localStorage.
      localStorage.setItem('isAdminAuthenticated', 'true');
      router.push('/admin');
    } else {
      toast({
        title: t('admin_login.toast_failed_title'),
        description: t('admin_login.toast_failed_description'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('admin_login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('admin_login.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('admin_login.password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('admin_login.password_hint')}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              {t('admin_login.login_button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
