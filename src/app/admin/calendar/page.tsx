
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
        <Button asChild variant="ghost" className="mb-2 -ml-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="font-headline text-3xl font-bold">Manage Calendar</h1>
        <p className="text-muted-foreground">Add, edit, review, and manage all calendar events.</p>
      </header>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {permissions.canManage && (
            <TabsContent value="manage">
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
                <TabsContent value="single-event">
                  <EventSubmissionForm />
                </TabsContent>
                <TabsContent value="bulk-upload">
                  <BulkUploadForm />
                </TabsContent>
            </>
        )}
        
        {permissions.canReview && (
            <TabsContent value="review">
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
