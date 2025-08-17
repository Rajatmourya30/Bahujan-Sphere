'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';
import Link from 'next/link';

const mockEvents = {
  '14': [
    { 
      title: 'Birth of Dr. B. R. Ambedkar', 
      tags: ['Ambedkarite'],
      description: 'The birth of Bhimrao Ramji Ambedkar, a pivotal figure in Indian history, jurist, economist, politician and social reformer.',
      readMoreUrl: 'https://en.wikipedia.org/wiki/B._R._Ambedkar'
    },
    { 
      title: 'Dhamma Chakra Pravartan Din', 
      tags: ['Buddhist'],
      description: 'Dr. Ambedkar, along with his 365,000 followers, converted to Buddhism at Deekshabhoomi in Nagpur.',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Dhamma_Chakra_Pravartan_Din'
    },
  ],
  '3': [{ 
    title: 'Birth of Savitribai Phule', 
    tags: ['Social Reform'],
    description: 'Savitribai Phule, a social reformer, educationalist, and poet from Maharashtra, is regarded as the first female teacher of India.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Savitribai_Phule'
  }],
  '26': [{ 
    title: 'Constitution Day', 
    tags: ['Constitutional'],
    description: 'On this day, the Constituent Assembly of India adopted the Constitution of India, and it came into effect on 26 January 1950.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Constitution_Day_(India)'
  }],
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
      
      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">
            Events on {date ? date.toLocaleDateString() : 'selected date'}
        </h2>
        {dayEvents.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {dayEvents.map((event, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>
                  <div className="flex flex-col items-start text-left">
                    <p className="font-bold">{event.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-4">{event.description}</p>
                  <Button asChild size="sm">
                    <Link href={event.readMoreUrl} target="_blank">
                      Read More
                    </Link>
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground text-center py-8">No events for this day.</p>
        )}
      </div>
    </div>
  );
}
