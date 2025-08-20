
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import { ArrowRight, Book, Calendar, Store, Users } from 'lucide-react';

function FeatureCard({ title, description, href, icon: Icon }: { title: string, description: string, href: string, icon: React.ElementType }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardContent>
          <Button asChild variant="outline">
            <Link href={href}>
              Explore <ArrowRight className="ml-2" />
            </Link>
          </Button>
      </CardContent>
    </Card>
  )
}


export default function HomePage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="font-headline text-5xl font-bold tracking-tight">Welcome to BahujanSphere</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          {t('home.tagline')}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <FeatureCard 
          title="Event Calendar"
          description="Explore a historical calendar of significant events, anniversaries, and milestones relevant to the Bahujan community."
          href="/calendar"
          icon={Calendar}
        />
        <FeatureCard 
          title="Knowledge Hub"
          description="Discover and learn about organizations, movements, and key figures in Bahujan history."
          href="/knowledge-hub"
          icon={Users}
        />
        <FeatureCard 
          title="Digital Store"
          description="Support Bahujan creators, artists, and businesses by exploring a curated marketplace of goods and services."
          href="/store"
          icon={Store}
        />
        <FeatureCard 
          title="Recommended Books"
          description="Browse a curated list of essential books on Bahujan history, thought, and culture, with links to purchase."
          href="/books"
          icon={Book}
        />
      </section>
    </div>
  );
}
