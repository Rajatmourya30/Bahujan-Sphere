
'use client';

import { useBookmarks } from '@/hooks/use-bookmarks';
import { useLanguage } from '@/hooks/use-language';
import { allEvents } from '@/lib/events';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookmarkX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { t } = useLanguage();
  const { bookmarkedIds, removeBookmark } = useBookmarks();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isUserAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const bookmarkedEvents = allEvents.filter(event => bookmarkedIds.includes(event.id));

  if (!isAuthenticated) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold">{t('bookmarks_page.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('bookmarks_page.description')}
        </p>
      </header>
      
      {bookmarkedEvents.length > 0 ? (
        <div className="space-y-4">
          {bookmarkedEvents.map(event => (
            <Card key={event.id}>
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
                        onClick={() => removeBookmark(event.id)}
                    >
                        <BookmarkX className="mr-2" />
                        {t('bookmarks_page.remove_button')}
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
