import { EventCalendar } from "@/components/calendar/EventCalendar";

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold">Event Calendar</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore events by date. Click on a day to see what happened.
        </p>
      </header>
      <EventCalendar />
    </div>
  );
}
