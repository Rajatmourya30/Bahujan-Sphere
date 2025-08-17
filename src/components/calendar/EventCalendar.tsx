
'use client';

import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { mockEventsByDay, type CalendarEvent } from '@/lib/events';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

function EventListItem({ event, onSelect }: { event: CalendarEvent; onSelect: () => void }) {
  const { t } = useLanguage();
  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors hover:bg-muted"
      onClick={onSelect}
    >
      <div className="flex-1">
        <p className="font-semibold">{t(event.titleKey)}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {event.tagKeys.map((tagKey) => (
            <Badge key={tagKey} variant="secondary" className="text-xs">
              {t(tagKey)}
            </Badge>
          ))}
        </div>
      </div>
      <div className="ml-4 h-2 w-2 rounded-full bg-primary" />
    </div>
  );
}

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const dayEvents = useMemo(() => {
    if (!date) return [];
    // The mock data is keyed by day of the month, regardless of month/year.
    const dayKey = date.getDate().toString();
    return mockEventsByDay[dayKey as keyof typeof mockEventsByDay] || [];
  }, [date]);

  const eventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const currentMonth = displayMonth.getMonth();
    const currentYear = displayMonth.getFullYear();

    for (const day in mockEventsByDay) {
      const eventsOnDay = mockEventsByDay[day as keyof typeof mockEventsByDay];
      if (eventsOnDay) {
        // Since mock data is month-agnostic, we create a key for the current viewing month.
        const eventDate = new Date(currentYear, currentMonth, parseInt(day));
        const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        counts.set(key, eventsOnDay.length);
      }
    }
    return counts;
  }, [displayMonth]);

  const handleShare = async (event: CalendarEvent) => {
    const eventTitle = t(event.titleKey);
    const eventDescription = t(event.descriptionKey);
    const shareText = `${eventTitle}\n\n${eventDescription}\n\n${t('share.footer')}`;
    const shareUrl = event.readMoreUrl;

    if (window.isSecureContext && navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share action was cancelled or failed.', error);
      }
    } else {
      toast({
        title: t('share.unavailable_title'),
        description: t('share.unavailable_description'),
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex justify-center p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            className="p-4"
            eventCounts={eventCounts}
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
          <CardContent className="p-2">
            {dayEvents.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="space-y-1 p-2">
                  {dayEvents.map((event, index) => (
                    <EventListItem key={index} event={event} onSelect={() => setSelectedEvent(event)} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="py-8 text-center text-muted-foreground">{t('event_calendar.no_events')}</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{t(selectedEvent.titleKey)}</DialogTitle>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedEvent.tagKeys.map((tagKey) => (
                  <Badge key={tagKey} variant="secondary">
                    {t(tagKey)}
                  </Badge>
                ))}
              </div>
              <DialogDescription className="pt-4">{t(selectedEvent.descriptionKey)}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button variant="outline" size="sm" onClick={() => handleShare(selectedEvent)}>
                <Share2 className="mr-2 h-4 w-4" />
                {t('share.button_text')}
              </Button>
              <Button asChild size="sm">
                <Link href={selectedEvent.readMoreUrl} target="_blank">
                  {t('event_calendar.read_more_button')}
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
