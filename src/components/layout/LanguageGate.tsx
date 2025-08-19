'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/hooks/use-language';

export function LanguageGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, isLanguageLoading } = useLanguage();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setIsReady(true);
      return;
    }
    if (!isLanguageLoading) {
      if (!language) {
        if (pathname !== '/language-selection') {
          router.replace('/language-selection');
        } else {
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    }
  }, [router, pathname, language, isLanguageLoading]);

  if (!isReady || isLanguageLoading) {
    return (
      <div className="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden border-x bg-background p-4 pt-8 shadow-lg">
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }
  
  if (pathname === '/language-selection' && !language) {
    return <>{children}</>;
  }
  
  if (language) {
    return <>{children}</>;
  }

  return null;
}
