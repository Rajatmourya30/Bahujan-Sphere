
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

function EventDetail({ event, onShare }: { event: CalendarEvent; onShare: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {event.tagKeys.map((tagKey) => (
          <Badge key={tagKey} variant="secondary">{t(tagKey)}</Badge>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {t(event.descriptionKey)}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          {t('share.button_text')}
        </Button>
        <Button asChild size="sm">
          <Link href={event.readMoreUrl} target="_blank">
            {t('event_calendar.read_more_button')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();
  const { toast } = useToast();

  const eventDates = useMemo(() => {
    // In a real app, you'd fetch events for the visible months.
    // For this mock data, we'll just create dates for the current year.
    const year = new Date().getFullYear();
    const dates: Date[] = [];
    // Note: This is a simplified approach for mock data.
    // A real implementation should handle events spanning multiple years.
    Object.keys(mockEventsByDay).forEach(day => {
        // We need to iterate through months, as the day doesn't specify one.
        for (let month = 0; month < 12; month++) {
           dates.push(new Date(year, month, parseInt(day, 10)));
        }
    });
    return dates;
  }, []);

  const dayEvents = useMemo(() => {
    if (!date) return [];
    // We only use the day of the month for our mock data key.
    const dayKey = date.getDate().toString();
    return mockEventsByDay[dayKey as keyof typeof mockEventsByDay] || [];
  }, [date]);

  const handleShare = async (event: CalendarEvent) => {
    const eventTitle = t(event.titleKey);
    const eventDescription = t(event.descriptionKey);
    const shareText = `${eventTitle}\n\n${eventDescription}\n\n${t('share.footer')}`;
    const shareUrl = event.readMoreUrl;

    if (navigator.share) {
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
            variant: 'destructive',
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
                {dayEvents.map((event) => (
                   <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-semibold">{t(event.titleKey)}</h3>
                      <EventDetail event={event} onShare={() => handleShare(event)} />
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
  );
}
