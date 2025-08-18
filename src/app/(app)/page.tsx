
'use client';
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { Logo } from "@/components/shared/Logo";
import { useLanguage } from "@/hooks/use-language";
import { allEvents } from "@/lib/events";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<typeof allEvents>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // In a real app, you'd fetch from an API
        // For now, we simulate a fetch
        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);


  return (
    <div className="space-y-4">
      <header className="text-center pb-4 border-b">
        <div className="flex justify-center items-center gap-2">
            <Logo className="dark:text-primary-foreground" />
            <h1 className="font-headline text-3xl font-bold text-primary dark:text-primary-foreground">BahujanSphere</h1>
        </div>
        <p className="mt-2 text-md text-muted-foreground max-w-3xl mx-auto">
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
