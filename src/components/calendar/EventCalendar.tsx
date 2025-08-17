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
      
      <div className="md:col-span-1">
        <h2 className="font-headline text-2xl font-bold mb-4">
            Events on {date ? date.toLocaleDateString() : 'selected date'}
        </h2>
        {dayEvents.length > 0 ? (
          <ul className="space-y-4">
            {dayEvents.map((event, index) => (
              <li key={index}>
                <Card className="bg-card hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                        <p className="font-bold">{event.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                        </div>
                    </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-8">No events for this day.</p>
        )}
      </div>
    </div>
  );
}
