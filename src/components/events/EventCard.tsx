'use client';

import type { Event } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 border-border bg-card">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={event.imageUrl}
            alt={event.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint="historical event"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-muted-foreground font-semibold">{event.date}</p>
        <CardTitle className="mt-1 font-headline text-xl leading-tight">{event.title}</CardTitle>
        <p className="mt-2 text-sm text-foreground/80">{event.summary}</p>
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start w-full">
        <div className="flex flex-wrap gap-2 mb-4">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        {event.readMoreUrl && (
          <Button asChild size="sm" className="w-full">
            <Link href={event.readMoreUrl} target="_blank">
              Read More
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
