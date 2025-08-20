
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bookmark, Library, Store, BookOpenCheck, Calendar } from 'lucide-react';
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
    { href: '/calendar', label: t('nav.calendar') },
    { href: '/reading-room', label: t('nav.reading_room') },
    { href: '/knowledge-hub', label: t('nav.knowledge') },
    { href: '/store', label: t('nav.store') },
  ];

  // Hide nav on admin pages, login, signup, etc.
  if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup' || pathname === '/language-selection') {
    return null;
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-primary hidden sm:inline-block">BahujanSphere</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-2">
           {navItems.map(item => (
                <Button key={item.label} asChild variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}>
                    <Link href={item.href}>
                        {item.label}
                    </Link>
                </Button>
           ))}
        </nav>
        <div className="flex items-center space-x-2 ml-auto">
            {isAuthenticated ? (
                <>
                    <Button asChild variant={pathname.startsWith('/bookmarks') ? 'secondary' : 'ghost'} size="icon" aria-label="Bookmarks">
                        <Link href="/bookmarks"><Bookmark /></Link>
                    </Button>
                    <Button asChild variant={pathname.startsWith('/profile') ? 'secondary' : 'ghost'} size="icon" aria-label="Profile">
                        <Link href="/profile"><User /></Link>
                    </Button>
                </>
            ) : (
                <Button asChild>
                    <Link href="/login">Login / Sign Up</Link>
                </Button>
            )}
        </div>
      </div>
    </header>
  );
}
