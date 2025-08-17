
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { allEvents, CalendarEvent } from '@/lib/events';
import { EventManagementTable } from '@/components/admin/EventManagementTable';
import { ManageEventDialog } from '@/components/admin/ManageEventDialog';

export default function ManageCalendarPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState(allEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleOpenDialog = (event: CalendarEvent | null = null) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };
  
  const handleSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      setEvents(currentEvents => currentEvents.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e));
    } else {
      setEvents(currentEvents => [...currentEvents, { ...eventData, id: `event-${Date.now()}` }]);
    }
  };

  const handleRemove = (eventId: string) => {
    setEvents(currentEvents => currentEvents.filter(e => e.id !== eventId));
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-4">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="font-headline text-3xl font-bold">Manage Calendar Events</h1>
          <p className="text-muted-foreground">Add, edit, or remove calendar events.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </header>

      <section>
        <EventManagementTable
          events={events}
          onEdit={handleOpenDialog}
          onRemove={handleRemove}
        />
      </section>

      {isDialogOpen && (
        <ManageEventDialog
          event={editingEvent}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
