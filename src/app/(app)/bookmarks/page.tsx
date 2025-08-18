
'use client';

import { useBookmarkStore } from '@/hooks/use-bookmarks';
import { useLanguage } from '@/hooks/use-language';
import { allEvents, type CalendarEvent } from '@/lib/events';
import { allKnowledgeOrganizations, type KnowledgeOrganization } from '@/lib/knowledge-hub';
import { allBahujanStores, type BahujanStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookmarkX, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

function EventBookmarkCard({ event, onRemove }: { event: CalendarEvent, onRemove: (id: string) => void }) {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">{t(event.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t(event.descriptionKey)}</p>
                <div className="flex flex-wrap gap-2">
                    {event.tagKeys.map(tagKey => (
                        <Badge key={tagKey} variant="secondary">{t(tagKey)}</Badge>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <Button asChild size="sm" variant="link" className="p-0">
                        <Link href={event.readMoreUrl} target="_blank">
                            {t('event_calendar.read_more_button')}
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(event.id)}
                    >
                        <BookmarkX className="mr-2" />
                        {t('bookmarks_page.remove_button')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function StoreBookmarkCard({ store, onRemove }: { store: BahujanStore, onRemove: (id: string) => void }) {
    const { t } = useLanguage();
    return (
        <Card className="flex flex-col text-center">
            <CardHeader className="items-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border">
                    <Image
                        src={store.imageUrl}
                        alt={t(store.nameKey)}
                        fill
                        className="object-cover"
                        data-ai-hint={store.imageAiHint}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardTitle className="font-headline text-lg">{t(store.nameKey)}</CardTitle>
                <CardDescription className="mt-2 text-sm">{t(store.descriptionKey)}</CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full">
                    <Link href={store.storeUrl} target="_blank">
                        {t('store.visit_store_button')}
                    </Link>
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(store.id)}
                >
                    <BookmarkX className="mr-2" />
                    {t('bookmarks_page.remove_button')}
                </Button>
            </CardFooter>
        </Card>
    );
}

function OrgBookmarkCard({ org, onRemove }: { org: KnowledgeOrganization, onRemove: (id: string) => void }) {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                 <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                        src={org.logoUrl}
                        alt={t(org.nameKey)}
                        fill
                        className="object-contain p-1"
                        data-ai-hint={org.imageAiHint}
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{t(org.nameKey)}</CardTitle>
                    <CardDescription className="mt-1 text-sm">{t(org.descriptionKey)}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
                 <Button asChild variant="outline" className="w-full">
                    <Link href={org.websiteUrl} target="_blank">
                        <Globe className="mr-2" />
                        {t('knowledge_hub.visit_website_button')}
                    </Link>
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(org.id)}
                >
                    <BookmarkX className="mr-2" />
                    {t('bookmarks_page.remove_button')}
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function BookmarksPage() {
  const { t } = useLanguage();
  const { bookmarkedIds: eventIds, removeBookmark: removeEvent } = useBookmarkStore('eventBookmarks');
  const { bookmarkedIds: storeIds, removeBookmark: removeStore } = useBookmarkStore('storeBookmarks');
  const { bookmarkedIds: orgIds, removeBookmark: removeOrg } = useBookmarkStore('knowledgeHubBookmarks');

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const bookmarkedEvents = allEvents.filter(event => eventIds.includes(event.id));
  const bookmarkedStores = allBahujanStores.filter(store => storeIds.includes(store.id));
  const bookmarkedOrgs = allKnowledgeOrganizations.filter(org => orgIds.includes(org.id));

  const totalBookmarks = bookmarkedEvents.length + bookmarkedStores.length + bookmarkedOrgs.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold">{t('bookmarks_page.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('bookmarks_page.description')}
        </p>
      </header>
      
      {totalBookmarks > 0 ? (
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Events ({bookmarkedEvents.length})</TabsTrigger>
            <TabsTrigger value="stores">Stores ({bookmarkedStores.length})</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge ({bookmarkedOrgs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            {bookmarkedEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {bookmarkedEvents.map(event => (
                        <EventBookmarkCard key={event.id} event={event} onRemove={removeEvent} />
                    ))}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">No bookmarked events.</p>}
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
             {bookmarkedStores.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {bookmarkedStores.map(store => (
                        <StoreBookmarkCard key={store.id} store={store} onRemove={removeStore} />
                    ))}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">No bookmarked stores.</p>}
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
             {bookmarkedOrgs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {bookmarkedOrgs.map(org => (
                        <OrgBookmarkCard key={org.id} org={org} onRemove={removeOrg} />
                    ))}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">No bookmarked organizations.</p>}
          </TabsContent>

        </Tabs>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <h3 className="text-lg font-medium">{t('bookmarks_page.no_bookmarks_title')}</h3>
            <p className="text-muted-foreground mt-2">{t('bookmarks_page.no_bookmarks_description')}</p>
             <Button asChild className="mt-4">
                <Link href="/">{t('bookmarks_page.browse_events_button')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
