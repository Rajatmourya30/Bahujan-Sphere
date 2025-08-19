
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Security Check: Verify if the user is in the teamMembers collection
      const teamQuery = query(collection(db, "teamMembers"), where("email", "==", user.email));
      const querySnapshot = await getDocs(teamQuery);
      
      if (querySnapshot.empty) {
        // If the user is not in the team collection, they are not an admin.
        await auth.signOut(); // Log them out immediately
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin panel.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // If they are a team member, proceed.
      localStorage.setItem('isAdminAuthenticated', 'true');
      router.push('/admin');
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
          description = 'No user found with this email. Please check the email or create an account in Firebase Authentication.';
          break;
        case 'auth/wrong-password':
          description = 'Incorrect password. Please check your password and try again.';
          break;
        case 'auth/invalid-credential':
          description = 'Invalid credentials. Please check your email and password.';
          break;
        default:
          description = 'Invalid credentials. Please check your email and password.';
          break;
      }
      toast({
        title: t('admin_login.toast_failed_title'),
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('admin_login.title')}</CardTitle>
          <CardDescription>
            Please log in with an admin account created in the Firebase Authentication console.
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
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('admin_login.password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin_login.login_button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
