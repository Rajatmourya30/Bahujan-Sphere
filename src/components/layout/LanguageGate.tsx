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
    // Always allow access to the admin section immediately, regardless of language loading state.
    if (pathname.startsWith('/admin')) {
      setIsReady(true);
      return;
    }

    // If we're loading the language preference, don't do anything yet.
    if (isLanguageLoading) {
      return;
    }

    const isLanguageSelectionPage = pathname === '/language-selection';

    // If language is not set and we are not on the selection page, redirect there.
    if (!language && !isLanguageSelectionPage) {
      router.replace('/language-selection');
    } else {
      // If language is set or we are on the correct page, the component is ready.
      setIsReady(true);
    }
  }, [router, pathname, language, isLanguageLoading]);

  // Show a loading skeleton while we determine the language status.
  if (!isReady) {
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

  // Render the children (the rest of the app)
  return <>{children}</>;
}
