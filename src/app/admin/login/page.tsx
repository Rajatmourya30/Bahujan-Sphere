
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { signInWithEmailAndPassword, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const isTeamMember = async (user: User): Promise<boolean> => {
      // Primary check: UID-based document lookup (more secure and efficient)
      const teamMemberDocRef = doc(db, "teamMembers", user.uid);
      const teamMemberDoc = await getDoc(teamMemberDocRef);
      if (teamMemberDoc.exists()) {
          return true;
      }

      // Fallback check: Email-based query (for legacy or different structures)
      const teamQuery = query(collection(db, "teamMembers"), where("email", "==", user.email));
      const querySnapshot = await getDocs(teamQuery);
      return !querySnapshot.empty;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (await isTeamMember(user)) {
            router.replace('/admin');
        } else {
            setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);


  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Special bypass for the original admin user
      if (user.email === 'rajatmourya82@gmail.com' && !(await isTeamMember(user))) {
        try {
          // Automatically add the original admin to teamMembers collection
          await setDoc(doc(db, 'teamMembers', user.uid), {
            name: 'Rajat Mourya',
            email: user.email,
            role: 'Admin',
            joinedAt: serverTimestamp()
          });
          toast({
            title: 'Admin Access Granted',
            description: 'You have been automatically added to the admin team.',
            variant: 'default',
          });
        } catch (addError) {
          console.error('Error adding admin user:', addError);
          toast({
            title: 'Setup Required',
            description: 'Please contact system administrator to add you to the team.',
            variant: 'destructive',
          });
          await auth.signOut();
          setIsLoading(false);
          return;
        }
      }

      // Security Check: Verify if the user is in the teamMembers collection
      if (!(await isTeamMember(user))) {
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
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'Invalid credentials. Please check your email and password.';
          break;
        default:
          description = 'An error occurred during login. Please check the console for details.';
          console.error("Login error:", error);
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
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleLogin();
  }
  
  if (isCheckingAuth) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-muted">
            <Skeleton className="h-96 w-full max-w-sm" />
        </div>
    )
  }

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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin_login.login_button')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
