
'use client';
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { Logo } from "@/components/shared/Logo";
import { useLanguage } from "@/hooks/use-language";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent } from "@/lib/events";
import { collection, onSnapshot, query, where, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isValid, parse } from 'date-fns';

// Function to parse various date formats, including Excel serial numbers
function parseDate(dateValue: any): Date {
    if (!dateValue) return new Date(0); // Return an invalid date if no value

    // Case 1: Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
        return (dateValue as Timestamp).toDate();
    }

    // Case 2: Excel Serial Number (which comes as a string or number)
    const numericDate = Number(dateValue);
    if (!isNaN(numericDate) && numericDate > 0) {
        // Excel serial date is the number of days since 1900-01-01.
        // JS Date is milliseconds since 1970-01-01.
        // 25569 is the number of days between 1900 and 1970, accounting for Excel's 1900 leap year bug.
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + numericDate * 24 * 60 * 60 * 1000);
    }
    
    // Case 3: Standard string date
    if (typeof dateValue === 'string') {
        const parsedDate = parse(dateValue, 'd MMMM yyyy', new Date(0));
        if (isValid(parsedDate)) {
            return parsedDate;
        }
    }
    
    // Fallback for any other format or invalid string
    const directParsed = new Date(dateValue);
    if(isValid(directParsed)) {
        return directParsed;
    }

    return new Date(0); // Return an invalid date as a final fallback
}


export default function Home() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            const eventDate = parseDate(data.date);
            
            if (!isValid(eventDate)) {
                console.warn(`Invalid date value encountered: "${data.date}" for doc ID ${doc.id}`);
            }

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
