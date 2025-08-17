
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

const rolesByEmail: Record<string, string> = {
    'admin@example.com': 'Admin',
    'editor@example.com': 'Editor',
    'reviewer@example.com': 'Reviewer',
    'contributor@example.com': 'Contributor',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    const userRole = rolesByEmail[email];
    if (password === 'admin123' && userRole) {
      localStorage.setItem('isAdminAuthenticated', 'true');
      localStorage.setItem('adminUserRole', userRole);
      localStorage.setItem('adminUserEmail', email);
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
          <CardDescription>
            Log in with different emails to test roles (password: admin123).
            <br />- admin@example.com
            <br />- editor@example.com
            <br />- reviewer@example.com
            <br />- contributor@example.com
          </CardDescription>
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
