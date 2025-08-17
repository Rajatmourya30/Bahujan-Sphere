
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewSubmissionsTable, type PendingEvent } from './ReviewSubmissionsTable';

const samplePendingEvents: PendingEvent[] = [
    { id: 'sub1', title: 'Birth of Guru Ravidas', submittedBy: 'contributor1@example.com', submittedAt: '2024-07-20T10:00:00Z', date: 'Full moon, month of Magha', summary: 'The birth of Guru Ravidas, a North Indian mystic poet-sant of the Bhakti movement.' },
    { id: 'sub2', title: 'Periyar Self-Respect Conference', submittedBy: 'contributor2@example.com', submittedAt: '2024-07-21T11:30:00Z', date: 'February 1929', summary: 'The first Self-Respect Conference was held in Chengalpattu, organised by Periyar E. V. Ramasamy.' },
    { id: 'sub3', title: 'Death Anniversary of Jotirao Phule', submittedBy: 'contributor1@example.com', submittedAt: '2024-07-22T09:00:00Z', date: '28 November 1890', summary: 'The passing of Jotirao Phule, a prominent social reformer and thinker.' },
];


export function ReviewSubmissionsTab() {
  const [pendingEvents, setPendingEvents] = useState(samplePendingEvents);

  const handleReview = (eventId: string, action: 'approve' | 'reject') => {
    console.log(`Event ${eventId} has been ${action}d.`);
    setPendingEvents(currentEvents =>
        currentEvents.filter(event => event.id !== eventId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Community Submissions</CardTitle>
        <CardDescription>
          Approve or reject events submitted by contributors. Approved events will appear on the public calendar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingEvents.length > 0 ? (
            <ReviewSubmissionsTable
                events={pendingEvents}
                onReview={handleReview}
            />
        ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground mt-2">There are no pending submissions to review.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
