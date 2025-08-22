
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
import { getMonth, getDate } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { parseDate } from '@/lib/date-parser';
import Image from 'next/image';
import { useAuthAction } from '@/hooks/useAuthAction';
import { buddhistEvents2024 } from '@/lib/buddhist-events';


function EventDetail({ event, onReadMoreClick }: { event: CalendarEvent, onReadMoreClick: () => void }) {
  const { t } = useLanguage();
  const { isBookmarked, toggleBookmark } = useBookmarkStore('eventBookmarks');
  const { performAction, AuthActionPrompt } = useAuthAction();
  
  const descriptionText = event.descriptionKey ? t(event.descriptionKey) : event.summary;
  const isLongDescription = descriptionText.length > 150;
  const displayDescription = isLongDescription
    ? `${descriptionText.substring(0, 150)}...`
    : descriptionText;
  
  const tagsToDisplay = event.tagKeys ? event.tagKeys.map(t) : event.tags;


  return (
    <>
      <AuthActionPrompt />
      <div className="flex flex-col sm:flex-row gap-4">
        {event.imageUrl && (
          <div className="relative w-full sm:w-1/3 aspect-square flex-shrink-0">
              <Image 
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="rounded-lg object-cover"
                  data-ai-hint={event.imageAiHint}
              />
          </div>
        )}
        <div className="flex flex-col flex-grow space-y-3">
            <div className="flex flex-wrap gap-2">
              {tagsToDisplay?.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            <p className="text-sm flex-grow">
              {displayDescription}
            </p>
            <div className="flex justify-between items-center mt-auto">
               <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={onReadMoreClick}>
                      {t('event_calendar.read_more_button')}
                  </Button>
              </div>
              <Button
                  variant="outline"
                  size="icon"
                  onClick={() => performAction(() => toggleBookmark(event.id))}
                  aria-label={t('event_calendar.bookmark_button')}
                  className="shrink-0"
              >
                  <Bookmark className={cn("h-5 w-5", isBookmarked(event.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
              </Button>
            </div>
        </div>
      </div>
    </>
  );
}

// Helper function to check for anniversaries (same month and day)
const isAnniversary = (eventDate: Date, selectedDate: Date) => {
    return getMonth(eventDate) === getMonth(selectedDate) && getDate(eventDate) === getDate(selectedDate);
}

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data, 
                date: parseDate(data.date),
                title: data.title,
                summary: data.summary,
                tags: data.tags,
                imageUrl: data.imageUrl,
                imageAiHint: data.imageAiHint,
                readMoreUrl: data.readMoreUrl,
            } as CalendarEvent;
        });
        // Combine Firestore events with static Buddhist events
        setAllEvents([...fetchedEvents, ...buddhistEvents2024]);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch events:", error);
        // Still load Buddhist events even if Firestore fails
        setAllEvents(buddhistEvents2024);
        setIsLoading(false);
    });
    
    return () => {
        unsubscribeFirestore();
    };
  }, []);
  
  const dayEvents = useMemo(() => {
    if (!date) return [];
    return allEvents.filter(event => isAnniversary(event.date as Date, date));
  }, [date, allEvents]);
  
  const eventDates = useMemo(() => {
    return allEvents.map(event => event.date as Date);
  }, [allEvents]);


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
                isAnniversary={isAnniversary}
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
                     <div key={event.id} className="space-y-4">
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
