import { EventList } from "@/components/events/EventList";

export default function BookmarksPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold">Your Bookmarks</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Events you've saved for later.
        </p>
      </header>
      {/* In a real app, this would be filtered to only show bookmarked events */}
      <EventList />
    </div>
  );
}
