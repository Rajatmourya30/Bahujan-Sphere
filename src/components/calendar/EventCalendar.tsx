'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockEvents = {
  '14': [
    { title: 'Birth of Dr. B. R. Ambedkar', tags: ['Ambedkarite'] },
    { title: 'Dhamma Chakra Pravartan Din', tags: ['Buddhist'] },
  ],
  '3': [{ title: 'Birth of Savitribai Phule', tags: ['Social Reform'] }],
  '26': [{ title: 'Constitution Day', tags: ['Constitutional'] }],
};

export function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const selectedDay = date ? date.getDate().toString() : null;
  const dayEvents = selectedDay ? mockEvents[selectedDay as keyof typeof mockEvents] || [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-4 w-full"
            />
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="font-headline">
              Events on {date ? date.toLocaleDateString() : 'selected date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayEvents.length > 0 ? (
              <ul className="space-y-4">
                {dayEvents.map((event, index) => (
                  <li key={index} className="p-4 bg-secondary/50 rounded-lg">
                    <p className="font-bold">{event.title}</p>
                    <div className="mt-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No events for this day.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
