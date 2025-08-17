import { EventList } from "@/components/events/EventList";

export default function Home() {
  return (
    <div className="space-y-12">
      <header className="text-center py-8 md:py-16 border-b">
        <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary">BahujanSphere</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Exploring the moments and movements that shape the Bahujan legacy. A community-curated calendar of historical significance.
        </p>
      </header>
      
      <EventList />
    </div>
  );
}
