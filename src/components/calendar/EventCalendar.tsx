'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { mockEventsByDay } from '@/lib/events';

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t } = useLanguage();
  const selectedDay = date ? date.getDate().toString() : null;
  const dayEvents = selectedDay ? mockEventsByDay[selectedDay as keyof typeof mockEventsByDay] || [] : [];

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-4"
          />
        </CardContent>
      </Card>
      
      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">
            {t('event_calendar.events_on_date', { date: date ? date.toLocaleDateString() : t('event_calendar.selected_date') })}
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
                  <Button asChild size="sm">
                    <Link href={event.readMoreUrl} target="_blank">
                      {t('event_calendar.read_more_button')}
                    </Link>
                  </Button>
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
