
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function GoogleAdsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
      // In a real app, you'd check the connection status from your backend
      const adMobStatus = localStorage.getItem('adMobConnected') === 'true';
      setIsConnected(adMobStatus);
    }
  }, [router]);
  
  const handleConnect = () => {
      // This is a simulation. In a real app, this would trigger an OAuth flow.
      localStorage.setItem('adMobConnected', 'true');
      setIsConnected(true);
  }
  
  const handleDisconnect = () => {
      localStorage.removeItem('adMobConnected');
      setIsConnected(false);
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">{t('google_ads_page.title')}</h1>
        <p className="text-muted-foreground">{t('google_ads_page.description')}</p>
      </header>
      
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertTitle>{t('google_ads_page.alert_title')}</AlertTitle>
        <AlertDescription>
          {t('google_ads_page.alert_description')}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t('google_ads_page.card_title')}</CardTitle>
          <CardDescription>{t('google_ads_page.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Megaphone className="h-8 w-8" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Google AdMob</p>
              <p className="text-sm text-muted-foreground">
                {t('google_ads_page.service_description')}
              </p>
            </div>
            {isConnected ? (
                <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>{t('google_ads_page.status_connected')}</span>
                </div>
            ) : (
                <div className="flex items-center text-destructive">
                    <XCircle className="mr-2 h-5 w-5" />
                    <span>{t('google_ads_page.status_not_connected')}</span>
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
            {isConnected ? (
                <Button variant="destructive" onClick={handleDisconnect}>{t('google_ads_page.disconnect_button')}</Button>
            ) : (
                <Button onClick={handleConnect}>{t('google_ads_page.connect_button')}</Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
