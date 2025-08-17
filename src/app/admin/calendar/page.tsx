
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

type UserRole = 'Admin' | 'Editor' | 'Reviewer' | 'Contributor' | null;

export default function ManageCalendarPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState(allEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    const role = localStorage.getItem('adminUserRole') as UserRole;
    if (authStatus !== 'true' || !role) {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
    }
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
  
  const permissions = {
      canManage: userRole === 'Admin' || userRole === 'Editor',
      canSubmit: userRole === 'Admin' || userRole === 'Editor' || userRole === 'Contributor',
      canReview: userRole === 'Admin' || userRole === 'Editor' || userRole === 'Reviewer',
  };

  if (!isAuthenticated || !userRole) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  const availableTabs = [
    { value: 'manage', label: 'Manage Events', visible: permissions.canManage },
    { value: 'single-event', label: 'Submit Single Event', visible: permissions.canSubmit },
    { value: 'bulk-upload', label: 'Submit Bulk Upload', visible: permissions.canSubmit },
    { value: 'review', label: 'Review Submissions', visible: permissions.canReview },
  ].filter(tab => tab.visible);
  
  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : '';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Calendar</h1>
        <p className="text-muted-foreground">Add, edit, review, and manage all calendar events.</p>
      </header>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
           {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="hover:bg-background/80">{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {permissions.canManage && (
            <TabsContent value="manage" className="mt-6">
                <EventManagementTable
                  events={events}
                  onEdit={handleOpenDialog}
                  onRemove={handleRemove}
                  onAdd={() => handleOpenDialog()}
                />
            </TabsContent>
        )}
        
        {permissions.canSubmit && (
            <>
                <TabsContent value="single-event" className="mt-6">
                  <EventSubmissionForm />
                </TabsContent>
                <TabsContent value="bulk-upload" className="mt-6">
                  <BulkUploadForm />
                </TabsContent>
            </>
        )}
        
        {permissions.canReview && (
            <TabsContent value="review" className="mt-6">
                <ReviewSubmissionsTab />
            </TabsContent>
        )}
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
