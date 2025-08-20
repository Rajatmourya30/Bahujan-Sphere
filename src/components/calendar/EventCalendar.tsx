
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '@/hooks/use-language';
import type { CalendarEvent } from '@/lib/events';
import { Badge } from '../ui/badge';
import { Bookmark } from 'lucide-react';
import { useBookmarkStore } from '@/hooks/use-bookmarks';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { EventDetailModal } from './EventDetailModal';
import { Separator } from '../ui/separator';
import { isSameDay, isValid, getMonth, getDate } from 'date-fns';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { parseDate } from '@/lib/date-parser';
import { Skeleton } from '../ui/skeleton';


function EventDetail({ event, onReadMoreClick }: { event: CalendarEvent, onReadMoreClick: () => void }) {
  const { t } = useLanguage();
  const { isBookmarked, toggleBookmark } = useBookmarkStore('eventBookmarks');
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);
  
  const handleBookmarkClick = () => {
    if (isAuthenticated) {
        toggleBookmark(event.id);
    } else {
        router.push('/login');
    }
  }

  const descriptionText = event.descriptionKey ? t(event.descriptionKey) : event.summary;
  const isLongDescription = descriptionText.length > 150;
  const displayDescription = isLongDescription
    ? `${descriptionText.substring(0, 150)}...`
    : descriptionText;
  
  const tagsToDisplay = event.tagKeys ? event.tagKeys.map(t) : event.tags;


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tagsToDisplay?.map((tag) => (
          <Badge key={tag} variant="secondary">{tag}</Badge>
        ))}
      </div>
      <p className="text-sm">
        {displayDescription}
      </p>
      <div className="flex justify-between items-center">
         <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onReadMoreClick}>
                {t('event_calendar.read_more_button')}
            </Button>
        </div>
        <Button
            variant="outline"
            size="icon"
            onClick={handleBookmarkClick}
            aria-label={t('event_calendar.bookmark_button')}
            className="shrink-0"
        >
            <Bookmark className={cn("h-5 w-5", isBookmarked(event.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
        </Button>
      </div>
    </div>
  );
}

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            const eventDate = parseDate(data.date);
            if (!isValid(eventDate)) {
                console.warn(`Invalid date value for doc ID ${doc.id}:`, data.date);
            }
            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        });
        setEvents(fetchedEvents);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching events:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const eventDates = useMemo(() => {
    if (isLoading) return [];
    // Filter out invalid dates to prevent calendar component from crashing
    return events.filter(event => isValid(event.date)).map(event => event.date);
  }, [events, isLoading]);

  const dayEvents = useMemo(() => {
    if (!date || isLoading) return [];
    return events.filter(event => {
      if (!isValid(event.date)) return false;
      // Compare month and day, ignoring the year for recurring events.
      return getMonth(event.date) === getMonth(date) && getDate(event.date) === getDate(date);
    });
  }, [date, events, isLoading]);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <Card className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-4"
                eventDates={eventDates}
                disabled={isLoading}
              />
            </Card>
        </div>
        
        <div className="lg:col-span-3">
          <h2 className="font-headline mb-4 text-2xl font-bold">
            {t('event_calendar.events_on_date', {
              date: date
                ? new Intl.DateTimeFormat(t('locale_code')).format(date)
                : t('event_calendar.selected_date'),
            })}
          </h2>
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
              ) : dayEvents.length > 0 ? (
                <div className="w-full space-y-4">
                  {dayEvents.map((event, index) => (
                     <div key={event.id} className="space-y-2">
                        {index > 0 && <Separator className="my-4" />}
                        <h3 className="font-semibold">{event.titleKey ? t(event.titleKey) : event.title}</h3>
                        <EventDetail event={event} onReadMoreClick={() => setSelectedEvent(event)} />
                     </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                    <p className="text-center text-muted-foreground">{t('event_calendar.no_events')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedEvent && (
        <EventDetailModal
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
