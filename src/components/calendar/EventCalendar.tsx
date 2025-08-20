
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
import { isSameDay } from 'date-fns';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { parseDate } from '@/lib/date-parser';


function EventDetail({ event, onReadMoreClick }: { event: CalendarEvent, onReadMoreClick: () => void }) {
  const { t } = useLanguage();
  const { isBookmarked, toggleBookmark } = useBookmarkStore('eventBookmarks');
  
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
            onClick={() => toggleBookmark(event.id)}
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (!user) {
            router.replace('/login');
        }
    });

    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data, 
                date: parseDate(data.date) 
            } as CalendarEvent;
        });
        setAllEvents(fetchedEvents);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch events:", error);
        setIsLoading(false);
    });
    
    return () => {
        unsubscribeAuth();
        unsubscribeFirestore();
    };
  }, [router]);

  const eventDates = useMemo(() => {
    return allEvents.map(event => event.date);
  }, [allEvents]);

  const dayEvents = useMemo(() => {
    if (!date) return [];
    return allEvents.filter(event => isSameDay(event.date, date));
  }, [date, allEvents]);

  if (isLoading) {
      return (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                  <Skeleton className="h-[320px] w-full" />
              </div>
              <div className="lg:col-span-3">
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      )
  }

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
              />
            </Card>
        </div>
        
        <div className="lg:col-span-3">
          <h2 className="font-headline mb-4 text-2xl font-bold">
            {t('event_calendar.events_on_date', {
              date: date
                ? new Intl.DateTimeFormat(t('locale_code'), { dateStyle: 'long' }).format(date)
                : t('event_calendar.selected_date'),
            })}
          </h2>
          <Card>
            <CardContent className="p-6">
              {dayEvents.length > 0 ? (
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
