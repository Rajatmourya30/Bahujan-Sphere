import { EventSubmissionForm } from "@/components/submit/EventSubmissionForm";

export default function SubmitEventPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold">Submit an Event</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Contribute to the BahujanSphere calendar by sharing a significant event.
        </p>
      </header>
      <EventSubmissionForm />
    </div>
  );
}
