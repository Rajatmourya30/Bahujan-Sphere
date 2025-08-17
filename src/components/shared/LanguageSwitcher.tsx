'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/use-language';
import { languages } from '@/lib/i18n/languages';
import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const { setLanguage } = useLanguage();
  const router = useRouter();

  const handleSwitch = (langCode: string) => {
    setLanguage(langCode);
    // Optional: force a reload or redirect if needed
    // router.refresh(); 
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onSelect={() => handleSwitch(lang.code)}>
            {lang.name.split('(')[0].trim()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
