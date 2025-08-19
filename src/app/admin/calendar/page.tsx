
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
import { auth, db } from '@/lib/firebase';
import { ReviewSubmissionsTab } from '@/components/admin/ReviewSubmissionsTab';
import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { isValid, parse } from 'date-fns';

// Function to parse various date formats, including Excel serial numbers
function parseDate(dateValue: any): Date {
    if (!dateValue) return new Date(0); // Return an invalid date if no value

    // Case 1: Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
        return (dateValue as Timestamp).toDate();
    }

    // Case 2: Excel Serial Number (which comes as a string or number)
    const numericDate = Number(dateValue);
    if (!isNaN(numericDate) && numericDate > 0) {
        // Excel serial date is the number of days since 1900-01-01.
        // JS Date is milliseconds since 1970-01-01.
        // 25569 is the number of days between 1900 and 1970, accounting for Excel's 1900 leap year bug.
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + numericDate * 24 * 60 * 60 * 1000);
    }
    
    // Case 3: Standard string date
    if (typeof dateValue === 'string') {
        const parsedDate = parse(dateValue, 'd MMMM yyyy', new Date(0));
        if (isValid(parsedDate)) {
            return parsedDate;
        }
    }
    
    // Fallback for any other format or invalid string
    const directParsed = new Date(dateValue);
    if(isValid(directParsed)) {
        return directParsed;
    }

    return new Date(0); // Return an invalid date as a final fallback
}


export default function ManageCalendarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

            if (!isValid(eventDate)) {
                 console.warn(`Invalid date value encountered: "${data.date}" for doc ID ${doc.id}`);
            }

            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        });
        setEvents(fetchedEvents);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch events:", error);
        toast({ title: 'Error', description: 'Could not fetch events from the database.', variant: 'destructive' });
        setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [firebaseUser, toast]);


  const handleOpenDialog = (event: CalendarEvent | null = null) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    // This logic would need to be updated to save to Firestore
    console.log("Saving event:", eventData);
    toast({ title: "Note", description: "Editing functionality is not yet fully implemented in this view." });
  };

  const handleRemove = (eventId: string) => {
    // This logic would need to be updated to remove from Firestore
     console.log("Removing event:", eventId);
     toast({ title: "Note", description: "Removal functionality is not yet fully implemented in this view." });
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
