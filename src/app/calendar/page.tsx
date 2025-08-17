
'use client';
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { useLanguage } from "@/hooks/use-language";

export default function CalendarPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold">{t('calendar_page.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('calendar_page.description')}
        </p>
      </header>
      <EventCalendar />
    </div>
  );
}
