
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/use-language';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navItems = [
    { href: '/', label: t('nav.calendar'), icon: Home, auth: false },
    { href: '/bookmarks', label: t('nav.bookmarks'), icon: Bookmark, auth: true },
    { href: '/profile', label: t('nav.profile'), icon: User, auth: true },
  ];

  useEffect(() => {
    // Check auth status from localStorage on the client side
    const authStatus = localStorage.getItem('isUserAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
  }, [pathname]); // Re-check on path change


  // Hide nav on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  // Hide nav on login/signup pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/language-selection') {
      return null;
  }

  return (
    <nav className="sticky bottom-0 z-50 mt-auto w-full border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          let href = item.href;
          // If item requires auth and user is not authenticated, link to login page
          if (item.auth && !isAuthenticated) {
            href = '/login';
          }
          
          const isActive = pathname === href;

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
