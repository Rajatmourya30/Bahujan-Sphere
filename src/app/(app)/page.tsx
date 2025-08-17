
'use client';
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { Logo } from "@/components/shared/Logo";
import { useLanguage } from "@/hooks/use-language";

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <header className="text-center pb-4 border-b">
        <div className="flex justify-center items-center gap-2">
            <Logo />
            <h1 className="font-headline text-3xl font-bold text-primary">BahujanSphere</h1>
        </div>
        <p className="mt-2 text-md text-muted-foreground max-w-3xl mx-auto">
          {t('home.tagline')}
        </p>
      </header>
      <EventCalendar />
    </div>
  );
}
