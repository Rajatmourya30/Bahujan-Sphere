'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
];

export default function LanguageSelectionPage() {
  const router = useRouter();

  const handleLanguageSelect = (langCode: string) => {
    localStorage.setItem('selectedLanguage', langCode);
    router.push('/');
  };

  return (
    <div className="flex justify-center items-center h-screen max-w-md mx-auto">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Logo />
            <CardTitle className="text-2xl font-headline">Welcome</CardTitle>
          </div>
          <CardDescription>Please select your language.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                variant="outline"
                size="lg"
              >
                {lang.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
