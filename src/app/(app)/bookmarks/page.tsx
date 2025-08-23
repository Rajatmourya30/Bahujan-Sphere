
'use client';

import { useBookmarkStore } from '@/hooks/use-bookmarks';
import { useLanguage } from '@/hooks/use-language';
import type { CalendarEvent } from '@/lib/events';
import type { KnowledgeOrganization } from '@/lib/knowledge-hub';
import type { BahujanStore } from '@/lib/store';
import type { Book } from '@/lib/books';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookmarkX, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { parseDate } from '@/lib/date-parser';

function EventBookmarkCard({ event, onRemove }: { event: CalendarEvent, onRemove: (id: string) => void }) {
    const { t } = useLanguage();
    const description = event.descriptionKey ? t(event.descriptionKey) : event.summary;
    const tags = event.tagKeys ? event.tagKeys.map(key => t(key)) : event.tags;
    const title = event.titleKey ? t(event.titleKey) : event.title;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
                <div className="flex flex-wrap gap-2">
                    {tags?.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    {event.readMoreUrl && (
                        <Button asChild size="sm" variant="link" className="p-0">
                            <Link href={event.readMoreUrl} target="_blank">
                                {t('event_calendar.read_more_button')}
                            </Link>
                        </Button>
                    )}
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
    const name = store.nameKey ? t(store.nameKey) : store.name;
    const description = store.descriptionKey ? t(store.descriptionKey) : store.description;

    return (
        <Card className="flex flex-col text-center">
            <CardHeader className="items-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border">
                    <Image
                        src={store.imageUrl}
                        alt={name}
                        fill
                        sizes="96px"
                        className="object-cover"
                        data-ai-hint={store.imageAiHint}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardTitle className="font-headline text-lg">{name}</CardTitle>
                <CardDescription className="mt-2 text-sm">{description}</CardDescription>
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
    const name = org.nameKey ? t(org.nameKey) : org.name;
    const description = org.descriptionKey ? t(org.descriptionKey) : org.description;

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                 <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                        src={org.logoUrl}
                        alt={name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                        data-ai-hint={org.imageAiHint}
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{name}</CardTitle>
                    <CardDescription className="mt-1 text-sm">{description}</CardDescription>
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

function BookBookmarkCard({ book, onRemove }: { book: Book, onRemove: (id: string) => void }) {
    const { t } = useLanguage();
    const title = book.titleKey ? t(book.titleKey) : book.title;
    const author = book.authorKey ? t(book.authorKey) : book.author;

    return (
        <Card>
            <CardHeader className="flex-row items-start gap-4">
                 <div className="relative h-32 w-24 flex-shrink-0">
                    <Image
                        src={book.imageUrl}
                        alt={title}
                        fill
                        sizes="96px"
                        className="object-cover rounded-md"
                        data-ai-hint={book.imageAiHint}
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                    <CardDescription className="text-sm font-medium">{author}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
                 <Button asChild className="w-full">
                    <Link href={book.affiliateUrl} target="_blank">
                        {t('books_page.buy_now_button')}
                    </Link>
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(book.id)}
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
  const { bookmarkedIds: bookIds, removeBookmark: removeBook } = useBookmarkStore('bookBookmarks');

  const [bookmarkedEvents, setBookmarkedEvents] = useState<CalendarEvent[]>([]);
  const [bookmarkedStores, setBookmarkedStores] = useState<BahujanStore[]>([]);
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<KnowledgeOrganization[]>([]);
  const [bookmarkedBooks, setBookmarkedBooks] = useState<Book[]>([]);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser); // Set user, can be null
        setIsLoading(true);

        const fetchData = async () => {
            // Fetch all items from all collections
            const eventsQuery = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
            const storesQuery = query(collection(db, 'stores'), where('status', '==', 'approved'));
            const orgsQuery = query(collection(db, 'knowledgeHub'), where('status', '==', 'approved'));
            const booksQuery = query(collection(db, 'books'), where('status', '==', 'approved'));
            
            const [eventsSnapshot, storesSnapshot, orgsSnapshot, booksSnapshot] = await Promise.all([
                getDocs(eventsQuery),
                getDocs(storesQuery),
                getDocs(orgsQuery),
                getDocs(booksQuery),
            ]);

            // Filter based on bookmarked IDs
            const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: parseDate(doc.data().date) } as CalendarEvent));
            setBookmarkedEvents(allEvents.filter(event => eventIds.includes(event.id)));

            const allStores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BahujanStore));
            setBookmarkedStores(allStores.filter(store => storeIds.includes(store.id)));

            const allOrgs = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeOrganization));
            setBookmarkedOrgs(allOrgs.filter(org => orgIds.includes(org.id)));

            const allBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
            setBookmarkedBooks(allBooks.filter(book => bookIds.includes(book.id)));
            
            setIsLoading(false);
        };

        fetchData();
    });
    return () => unsubscribe();
  }, [router, eventIds, storeIds, orgIds, bookIds]);

  const totalBookmarks = bookmarkedEvents.length + bookmarkedStores.length + bookmarkedOrgs.length + bookmarkedBooks.length;

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
  
  if (!user) {
    return (
        <div className="space-y-8">
             <header>
                <h1 className="font-headline text-4xl font-bold">{t('bookmarks_page.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('bookmarks_page.description')}
                </p>
            </header>
             <Card className="text-center py-16">
                <CardContent>
                    <h3 className="text-lg font-medium">Please Log In</h3>
                    <p className="text-muted-foreground mt-2">Log in to see your bookmarked items.</p>
                    <Button asChild className="mt-4">
                        <Link href="/login">Log In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Events ({bookmarkedEvents.length})</TabsTrigger>
            <TabsTrigger value="stores">Stores ({bookmarkedStores.length})</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge ({bookmarkedOrgs.length})</TabsTrigger>
            <TabsTrigger value="books">Books ({bookmarkedBooks.length})</TabsTrigger>
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
          
          <TabsContent value="books" className="mt-6">
             {bookmarkedBooks.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {bookmarkedBooks.map(book => (
                        <BookBookmarkCard key={book.id} book={book} onRemove={removeBook} />
                    ))}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">No bookmarked books.</p>}
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
