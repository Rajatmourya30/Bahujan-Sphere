
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { allEvents, CalendarEvent } from '@/lib/events';
import { EventManagementTable } from '@/components/admin/EventManagementTable';
import { ManageEventDialog } from '@/components/admin/ManageEventDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventSubmissionForm } from '@/components/submit/EventSubmissionForm';
import { BulkUploadForm } from '@/components/submit/BulkUploadForm';
import { ReviewSubmissionsTab } from '@/components/admin/ReviewSubmissionsTab';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ManageCalendarPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [events, setEvents] = useState(allEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        router.replace('/admin/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);


  const handleOpenDialog = (event: CalendarEvent | null = null) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      setEvents(currentEvents =>
        currentEvents.map(e => (e.id === editingEvent.id ? { ...e, ...eventData } : e))
      );
    } else {
      setEvents(currentEvents => [...currentEvents, { ...eventData, id: `event-${Date.now()}` }]);
    }
  };

  const handleRemove = (eventId: string) => {
    setEvents(currentEvents => currentEvents.filter(e => e.id !== eventId));
  };
  
  if (isLoading) {
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
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Calendar</h1>
        <p className="text-muted-foreground">Add, edit, review, and manage all calendar events.</p>
      </header>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
           <TabsTrigger value="manage">Manage Events</TabsTrigger>
           <TabsTrigger value="single-event">Submit Single Event</TabsTrigger>
           <TabsTrigger value="bulk-upload">Submit Bulk Upload</TabsTrigger>
           <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
            <EventManagementTable
              events={events}
              onEdit={handleOpenDialog}
              onRemove={handleRemove}
              onAdd={() => handleOpenDialog()}
            />
        </TabsContent>
        
        <TabsContent value="single-event" className="mt-6">
          <EventSubmissionForm />
        </TabsContent>
        <TabsContent value="bulk-upload" className="mt-6">
          <BulkUploadForm />
        </TabsContent>
        
        <TabsContent value="review" className="mt-6">
            <ReviewSubmissionsTab />
        </TabsContent>
      </Tabs>


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
