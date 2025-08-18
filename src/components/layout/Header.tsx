
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Bookmark, Library, Store, Book, BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Logo } from '../shared/Logo';
import { Button } from '../ui/button';

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { href: '/', label: t('nav.calendar'), icon: Home, auth: false },
    { href: '/knowledge-hub', label: t('nav.knowledge'), icon: Library, auth: false },
    { href: '/store', label: t('nav.store'), icon: Store, auth: false },
    { href: '/books', label: t('nav.books'), icon: Book, auth: false },
    { href: '/reading-room', label: t('nav.reading_room'), icon: BookOpenCheck, auth: false },
    { href: '/bookmarks', label: t('nav.bookmarks'), icon: Bookmark, auth: true },
  ];

  const profileItem = { href: '/profile', label: t('nav.profile'), icon: User, auth: true };

  // Hide nav on admin pages, login, signup, etc.
  if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup' || pathname === '/language-selection') {
    return null;
  }
  
  const getNavItem = (item: typeof navItems[0]) => {
      const href = item.auth && !isAuthenticated ? '/login' : item.href;
      const isActive = pathname.startsWith(href) && (href !== '/' || pathname === '/');
      return (
          <Button key={item.label} asChild variant={isActive ? 'secondary' : 'ghost'}>
              <Link href={href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
              </Link>
          </Button>
      );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-primary">BahujanSphere</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-2">
           {navItems.map(getNavItem)}
        </nav>
        <div className="flex items-center space-x-2">
            {isAuthenticated ? getNavItem(profileItem) : (
                <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            )}
        </div>
      </div>
    </header>
  );
}
