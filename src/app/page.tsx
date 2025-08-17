import { EventCalendar } from "@/components/calendar/EventCalendar";
import { EventList } from "@/components/events/EventList";
import { Logo } from "@/components/shared/Logo";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="text-center pb-8 border-b">
        <div className="flex justify-center items-center gap-2">
            <Logo />
            <h1 className="font-headline text-3xl font-bold text-primary">BahujanSphere</h1>
        </div>
        <p className="mt-4 text-md text-muted-foreground max-w-3xl mx-auto">
          Exploring the moments and movements that shape the Bahujan legacy.
        </p>
      </header>
      <EventCalendar />
      <EventList />
    </div>
  );
}
