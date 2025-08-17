import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Bookmark, Calendar, Home, PlusCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-headline text-xl font-bold text-foreground">
              BahujanSphere
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Home />
                Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/calendar">
                <Calendar />
                Calendar
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/bookmarks">
                <Bookmark />
                Bookmarks
              </Link>
            </Button>
            <Button asChild>
              <Link href="/submit">
                <PlusCircle />
                Submit Event
              </Link>
            </Button>
            <LanguageSwitcher />
          </nav>
          <div className="md:hidden">
            {/* Mobile menu could be added here */}
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
