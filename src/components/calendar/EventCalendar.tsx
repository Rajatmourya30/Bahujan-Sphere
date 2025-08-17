
'use client';

import { useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { mockEventsByDay, type CalendarEvent } from '@/lib/events';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

function EventDetail({ event }: { event: CalendarEvent }) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleShare = async () => {
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
        // Fallback for browsers that don't support Web Share API
        try {
            await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            toast({
                title: t('share.copied_title'),
                description: t('share.copied_description'),
            });
        } catch (err) {
            toast({
                title: t('share.unavailable_title'),
                description: t('share.unavailable_description'),
                variant: 'destructive',
            });
        }
    }
  };

  return (
    <AccordionContent>
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
            <Button variant="outline" size="sm" onClick={handleShare}>
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
    </AccordionContent>
  );
}

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();

  const dayEvents = useMemo(() => {
    if (!date) return [];
    // The mock data is keyed by day of the month, regardless of month/year.
    const dayKey = date.getDate().toString();
    return mockEventsByDay[dayKey as keyof typeof mockEventsByDay] || [];
  }, [date]);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex justify-center p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-4"
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
              <Accordion type="single" collapsible className="w-full">
                {dayEvents.map((event, index) => (
                  <AccordionItem value={`item-${index}`} key={event.id}>
                    <AccordionTrigger>{t(event.titleKey)}</AccordionTrigger>
                    <EventDetail event={event} />
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="py-8 text-center text-muted-foreground">{t('event_calendar.no_events')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
