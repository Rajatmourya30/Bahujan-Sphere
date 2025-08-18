
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '@/hooks/use-language';
import type { CalendarEvent } from '@/lib/events';
import { Badge } from '../ui/badge';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { EventDetailModal } from './EventDetailModal';
import { Separator } from '../ui/separator';
import { isSameDay } from 'date-fns';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function EventDetail({ event, onReadMoreClick }: { event: CalendarEvent, onReadMoreClick: () => void }) {
  const { t } = useLanguage();
  const { isBookmarked, toggleBookmark } = useBookmarks();
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

  const descriptionText = t(event.descriptionKey);
  const isLongDescription = descriptionText.length > 150;
  const displayDescription = isLongDescription
    ? `${descriptionText.substring(0, 150)}...`
    : descriptionText;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {event.tagKeys.map((tagKey) => (
          <Badge key={tagKey} variant="secondary">{t(tagKey)}</Badge>
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

interface EventCalendarProps {
    events: CalendarEvent[];
}

export function EventCalendar({ events }: EventCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const eventDates = useMemo(() => {
    return events.map(event => event.date);
  }, [events]);

  const dayEvents = useMemo(() => {
    if (!date) return [];
    return events.filter(event => isSameDay(event.date, date));
  }, [date, events]);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Card>
              <CardContent className="flex justify-center p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="p-4"
                  eventDates={eventDates}
                />
              </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="font-headline mb-4 text-2xl font-bold">
            {t('event_calendar.events_on_date', {
              date: date
                ? new Intl.DateTimeFormat(t('locale_code')).format(date)
                : t('event_calendar.selected_date'),
            })}
          </h2>
          <Card>
            <CardContent className="p-4">
              {dayEvents.length > 0 ? (
                <div className="w-full space-y-4">
                  {dayEvents.map((event, index) => (
                     <div key={event.id} className="space-y-2">
                        {index > 0 && <Separator className="my-4" />}
                        <h3 className="font-semibold">{t(event.titleKey)}</h3>
                        <EventDetail event={event} onReadMoreClick={() => setSelectedEvent(event)} />
                     </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">{t('event_calendar.no_events')}</p>
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
