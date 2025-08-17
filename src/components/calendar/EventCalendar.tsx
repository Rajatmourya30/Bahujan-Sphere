
'use client';

import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '@/hooks/use-language';
import { allEvents, type CalendarEvent } from '@/lib/events';
import { Badge } from '../ui/badge';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { EventDetailModal } from './EventDetailModal';
import { Separator } from '../ui/separator';

function EventDetail({ event, onReadMoreClick }: { event: CalendarEvent, onReadMoreClick: () => void }) {
  const { t } = useLanguage();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const router = useRouter();
  
  const handleBookmarkClick = () => {
    const isAuthenticated = localStorage.getItem('isUserAuthenticated') === 'true';
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

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const eventDates = useMemo(() => {
    // In a real app, you'd fetch events for the visible months.
    // For this mock data, we'll just create dates for the current year.
    const year = new Date().getFullYear();
    const dates: Date[] = [];
    // Note: This is a simplified approach for mock data.
    // A real implementation should handle events spanning multiple years.
    allEvents.forEach(event => {
        // We need to iterate through months, as the day doesn't specify one.
        for (let month = 0; month < 12; month++) {
           const eventDate = new Date(year, month, event.day);
           // check if the date is valid for that month
           if (eventDate.getDate() === event.day) {
               dates.push(eventDate);
           }
        }
    });
    return dates;
  }, []);

  const dayEvents = useMemo(() => {
    if (!date) return [];
    const dayOfMonth = date.getDate();
    return allEvents.filter(event => event.day === dayOfMonth);
  }, [date]);

  return (
    <>
      <div className="flex flex-col gap-8">
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

        <div>
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
