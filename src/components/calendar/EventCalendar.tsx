
'use client';

import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { mockEventsByDay, type CalendarEvent } from '@/lib/events';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const dayEvents = useMemo(() => {
    if (!date) return [];
    // The key in mockEventsByDay is the day of the month as a string (e.g., '14').
    // We use getUTCDate() to avoid timezone issues.
    const dayKey = date.getUTCDate().toString();
    return mockEventsByDay[dayKey as keyof typeof mockEventsByDay] || [];
  }, [date]);


  const eventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const currentMonth = displayMonth.getUTCMonth();
    const currentYear = displayMonth.getUTCFullYear();

    for (const day in mockEventsByDay) {
        const eventsOnDay = mockEventsByDay[day as keyof typeof mockEventsByDay];
        if (eventsOnDay) {
            // Note: This logic assumes events repeat monthly.
            // For a real app, the mockEventsByDay structure would need to include month/year.
            const date = new Date(Date.UTC(currentYear, currentMonth, parseInt(day)));
            const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
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
        <CardContent className="p-0 flex justify-center">
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
        <h2 className="font-headline text-2xl font-bold mb-4">
            {t('event_calendar.events_on_date', { date: date ? new Intl.DateTimeFormat(t('locale_code')).format(date) : t('event_calendar.selected_date') })}
        </h2>
        {dayEvents.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {dayEvents.map((event, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>
                  <div className="flex flex-col items-start text-left">
                    <p className="font-bold">{t(event.titleKey)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.tagKeys.map((tagKey) => (
                        <Badge key={tagKey} variant="secondary">{t(tagKey)}</Badge>
                      ))}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-4">{t(event.descriptionKey)}</p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={event.readMoreUrl} target="_blank">
                        {t('event_calendar.read_more_button')}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare(event)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {t('share.button_text')}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t('event_calendar.no_events')}</p>
        )}
      </div>
    </div>
  );
}
