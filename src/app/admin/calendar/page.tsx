
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { type CalendarEvent } from '@/lib/events';
import { EventManagementTable } from '@/components/admin/EventManagementTable';
import { ManageEventDialog } from '@/components/admin/ManageEventDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventSubmissionForm } from '@/components/submit/EventSubmissionForm';
import { BulkUploadForm } from '@/components/submit/BulkUploadForm';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { ReviewSubmissionsTab } from '@/components/admin/ReviewSubmissionsTab';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { isValid } from 'date-fns';
import { parseDate } from '@/lib/date-parser';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { buddhistEvents } from '@/lib/buddhist-events';
import { CalendarStatsDashboard } from '@/components/admin/CalendarStatsDashboard';


export default function ManageCalendarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        router.replace('/admin/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            const eventDate = parseDate(data.date);

            if (!isValid(eventDate) || eventDate.getFullYear() < 1000) { // Check for invalid or epoch dates
                 console.warn(`Invalid or fallback date value encountered: "${data.date}" for doc ID ${doc.id}`);
            }

            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        });
        setEvents([...fetchedEvents, ...buddhistEvents]);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch events:", error);
        toast({ title: 'Error', description: 'Could not fetch events from the database.', variant: 'destructive' });
        setEvents(buddhistEvents); // Fallback to Buddhist events
        setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [firebaseUser, toast]);


  const handleOpenDialog = (event: CalendarEvent | null = null) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleSave = async (eventData: Omit<CalendarEvent, 'id'>, newImageFile?: File) => {
    if (!firebaseUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to save.", variant: "destructive" });
        return;
    }
    
    const isBuddhistEvent = editingEvent?.id.startsWith('buddhist-');

    try {
        let imageUrl = editingEvent?.imageUrl || '';
        let imageStoragePath = editingEvent?.imageStoragePath || '';

        if (newImageFile) {
            const imageRef = ref(storage, `images/events/${Date.now()}-${newImageFile.name}`);
            await uploadBytes(imageRef, newImageFile);
            imageUrl = await getDownloadURL(imageRef);
            imageStoragePath = imageRef.fullPath;
        }

        const dataToSave: any = {
            ...eventData,
            date: Timestamp.fromDate(eventData.date as Date),
            imageUrl,
            imageStoragePath,
        };

        if (editingEvent && !isBuddhistEvent) {
            const eventRef = doc(db, 'calendarEvents', editingEvent.id);
            await updateDoc(eventRef, dataToSave);
            toast({ title: "Event Updated", description: "The event has been successfully updated." });
        } else {
            await addDoc(collection(db, 'calendarEvents'), {
                ...dataToSave,
                status: 'approved',
                approvedBy: firebaseUser.uid,
                approvedAt: serverTimestamp(),
            });
            const action = isBuddhistEvent ? "overwritten and saved as a new event." : "added to the calendar.";
            toast({ title: "Event Added", description: `The new event has been ${action}` });
        }
        setIsDialogOpen(false);
        setEditingEvent(null);
    } catch (error) {
        console.error("Error saving event:", error);
        toast({ title: "Error", description: "Could not save the event.", variant: "destructive" });
    }
  };

  const confirmRemove = async () => {
    if (!eventToDelete) return;
    
    if (eventToDelete.startsWith('buddhist-')) {
        toast({ title: "Action Not Allowed", description: "Core Buddhist events cannot be deleted directly. You can edit it to create your own version.", variant: "destructive"});
        setEventToDelete(null);
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'calendarEvents', eventToDelete));
        toast({ title: "Event Deleted", description: "The event has been successfully removed." });
    } catch (error) {
        console.error("Error deleting event:", error);
        toast({ title: "Error", description: "Could not delete the event.", variant: "destructive" });
    } finally {
        setEventToDelete(null);
    }
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
        <p className="text-muted-foreground">Add, edit, and manage all calendar events.</p>
      </header>

      <CalendarStatsDashboard />

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
           <TabsTrigger value="manage">Manage Events</TabsTrigger>
           <TabsTrigger value="single-event">Submit Single Event</TabsTrigger>
           <TabsTrigger value="bulk-upload">Submit Bulk Upload</TabsTrigger>
           <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
            <EventManagementTable
              events={events}
              onEdit={handleOpenDialog}
              onRemove={setEventToDelete}
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

      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
