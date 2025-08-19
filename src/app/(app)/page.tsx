
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import { Home, Library, Store, BookOpenCheck, ArrowRight } from 'lucide-react';

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  linkText: string;
}

function SectionCard({ icon: Icon, title, description, href, linkText }: SectionCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow" />
      <CardContent>
        <Button asChild className="w-full">
          <Link href={href}>
            {linkText} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Home,
      title: t('nav.calendar'),
      description: 'Explore significant historical and cultural events.',
      href: '/calendar',
      linkText: 'View Calendar',
    },
    {
      icon: Library,
      title: t('nav.knowledge'),
      description: 'Discover organizations dedicated to empowerment.',
      href: '/knowledge-hub',
      linkText: 'Explore Knowledge Hub',
    },
    {
      icon: Store,
      title: t('nav.store'),
      description: 'Support businesses and creators from the community.',
      href: '/store',
      linkText: 'Browse Stores',
    },
    {
      icon: BookOpenCheck,
      title: t('nav.reading_room'),
      description: 'Engage with important historical texts and documents.',
      href: '/reading-room',
      linkText: 'Visit Reading Room',
    },
  ];

  return (
    <div className="space-y-12">
      <header className="text-center py-8">
        <div className="flex justify-center items-center gap-2">
          <Logo className="h-10 w-10" />
          <h1 className="font-headline text-5xl font-bold text-primary">Welcome to BahujanSphere</h1>
        </div>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('home.tagline')}
        </p>
      </header>

      <main className="space-y-10">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {sections.map((section) => (
              <SectionCard key={section.title} {...section} />
            ))}
          </div>
        </section>
        
        {/* Placeholder for Featured Content Section */}
        <section>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Featured Content</CardTitle>
                    <CardDescription>Check out the latest additions from across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-16">
                    <p>(Dynamic featured content coming soon)</p>
                </CardContent>
            </Card>
        </section>

      </main>
    </div>
  );
}
