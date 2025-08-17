'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export function LanguageGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLanguageSet, setIsLanguageSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const selectedLanguage = localStorage.getItem('selectedLanguage');
    if (!selectedLanguage) {
      if (pathname !== '/language-selection') {
        router.replace('/language-selection');
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLanguageSet(true);
      setIsLoading(false);
    }
  }, [router, pathname]);

  if (isLoading || (!isLanguageSet && pathname !== '/language-selection')) {
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

  // Render the language selection page without the main layout
  if (pathname === '/language-selection' && !isLanguageSet) {
    return <>{children}</>;
  }

  // If language is set, render the app
  if (isLanguageSet) {
    return <>{children}</>;
  }

  return null;
}
