'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CalendarStats {
  totalEvents: number;
  approvedEvents: number;
  pendingEvents: number;
}

export function CalendarStatsDashboard() {
  const [stats, setStats] = useState<CalendarStats>({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all calendar events
    const allEventsQuery = query(collection(db, 'calendarEvents'));
    const unsubscribeAllEvents = onSnapshot(allEventsQuery, (snapshot) => {
      const totalEvents = snapshot.docs.length;
      setStats(prev => ({ ...prev, totalEvents }));
    }, (error) => {
      console.error("Error fetching calendar events:", error);
      setStats(prev => ({ ...prev, totalEvents: 0 }));
    });
    unsubscribes.push(unsubscribeAllEvents);

    // Subscribe to approved events
    const approvedEventsQuery = query(
      collection(db, 'calendarEvents'),
      where('status', '==', 'approved')
    );
    const unsubscribeApprovedEvents = onSnapshot(approvedEventsQuery, (snapshot) => {
      const approvedEvents = snapshot.docs.length;
      setStats(prev => ({ ...prev, approvedEvents }));
    }, (error) => {
      console.error("Error fetching approved calendar events:", error);
      setStats(prev => ({ ...prev, approvedEvents: 0 }));
    });
    unsubscribes.push(unsubscribeApprovedEvents);

    // Subscribe to pending events
    const pendingEventsQuery = query(
      collection(db, 'calendarEvents'),
      where('status', '==', 'pending')
    );
    const unsubscribePendingEvents = onSnapshot(pendingEventsQuery, (snapshot) => {
      const pendingEvents = snapshot.docs.length;
      setStats(prev => ({ ...prev, pendingEvents }));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching pending calendar events:", error);
      setStats(prev => ({ ...prev, pendingEvents: 0 }));
      setIsLoading(false);
    });
    unsubscribes.push(unsubscribePendingEvents);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Events',
      icon: Calendar,
      value: stats.totalEvents,
      description: 'All calendar events',
      color: 'text-blue-600',
    },
    {
      title: 'Approved Events',
      icon: CheckCircle,
      value: stats.approvedEvents,
      description: 'Live on calendar',
      color: 'text-green-600',
    },
    {
      title: 'Pending Events',
      icon: Clock,
      value: stats.pendingEvents,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Calendar Statistics</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
