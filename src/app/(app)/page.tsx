
'use client';
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { Logo } from "@/components/shared/Logo";
import { useLanguage } from "@/hooks/use-language";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent } from "@/lib/events";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore timestamp to JS Date
            const eventDate = data.date ? new Date(data.date) : new Date();
            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        });
        setEvents(fetchedEvents);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch events:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <div className="space-y-8">
      <header className="text-center pb-8 border-b">
        <div className="flex justify-center items-center gap-2">
            <Logo className="h-8 w-8" />
            <h1 className="font-headline text-5xl font-bold text-primary">BahujanSphere</h1>
        </div>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('home.tagline')}
        </p>
      </header>
      {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <EventCalendar events={events} />
      )}
    </div>
  );
}
