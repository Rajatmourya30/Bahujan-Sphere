'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Calendar, Store, BookOpen, Users, FileText, Building2 } from 'lucide-react';
import { buddhistEvents } from '@/lib/buddhist-events';

interface ContentStats {
  totalEvents: number;
  approvedEvents: number;
  pendingEvents: number;
  totalStores: number;
  approvedStores: number;
  pendingStores: number;
  totalBooks: number;
  approvedBooks: number;
  pendingBooks: number;
  totalOrganizations: number;
  approvedOrganizations: number;
  pendingOrganizations: number;
  totalReadingRoomDocs: number;
  approvedReadingRoomDocs: number;
  pendingReadingRoomDocs: number;
  totalTeamMembers: number;
}

export function ContentStatsDashboard() {
  const [stats, setStats] = useState<ContentStats>({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    totalStores: 0,
    approvedStores: 0,
    pendingStores: 0,
    totalBooks: 0,
    approvedBooks: 0,
    pendingBooks: 0,
    totalOrganizations: 0,
    approvedOrganizations: 0,
    pendingOrganizations: 0,
    totalReadingRoomDocs: 0,
    approvedReadingRoomDocs: 0,
    pendingReadingRoomDocs: 0,
    totalTeamMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Events
    const eventsQuery = query(collection(db, 'calendarEvents'));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => doc.data());
      const approvedEvents = events.filter(event => event.status === 'approved').length;
      const pendingEvents = events.filter(event => event.status === 'pending').length;
      
      setStats(prev => ({
        ...prev,
        totalEvents: events.length + buddhistEvents.length, // Include Buddhist events
        approvedEvents: approvedEvents + buddhistEvents.length,
        pendingEvents,
      }));
    });
    unsubscribers.push(unsubscribeEvents);

    // Stores
    const storesQuery = query(collection(db, 'stores'));
    const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
      const stores = snapshot.docs.map(doc => doc.data());
      const approvedStores = stores.filter(store => store.status === 'approved').length;
      const pendingStores = stores.filter(store => store.status === 'pending').length;
      
      setStats(prev => ({
        ...prev,
        totalStores: stores.length,
        approvedStores,
        pendingStores,
      }));
    });
    unsubscribers.push(unsubscribeStores);

    // Books
    const booksQuery = query(collection(db, 'books'));
    const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
      const books = snapshot.docs.map(doc => doc.data());
      const approvedBooks = books.filter(book => book.status === 'approved').length;
      const pendingBooks = books.filter(book => book.status === 'pending').length;
      
      setStats(prev => ({
        ...prev,
        totalBooks: books.length,
        approvedBooks,
        pendingBooks,
      }));
    });
    unsubscribers.push(unsubscribeBooks);

    // Organizations
    const orgsQuery = query(collection(db, 'knowledgeHub'));
    const unsubscribeOrgs = onSnapshot(orgsQuery, (snapshot) => {
      const orgs = snapshot.docs.map(doc => doc.data());
      const approvedOrgs = orgs.filter(org => org.status === 'approved').length;
      const pendingOrgs = orgs.filter(org => org.status === 'pending').length;
      
      setStats(prev => ({
        ...prev,
        totalOrganizations: orgs.length,
        approvedOrganizations: approvedOrgs,
        pendingOrganizations: pendingOrgs,
      }));
    });
    unsubscribers.push(unsubscribeOrgs);

    // Reading Room Documents
    const readingRoomQuery = query(collection(db, 'readingRoom'));
    const unsubscribeReadingRoom = onSnapshot(readingRoomQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      const approvedDocs = docs.filter(doc => doc.status === 'approved').length;
      const pendingDocs = docs.filter(doc => doc.status === 'pending').length;
      
      setStats(prev => ({
        ...prev,
        totalReadingRoomDocs: docs.length,
        approvedReadingRoomDocs: approvedDocs,
        pendingReadingRoomDocs: pendingDocs,
      }));
    });
    unsubscribers.push(unsubscribeReadingRoom);

    // Team Members
    const teamQuery = query(collection(db, 'teamMembers'));
    const unsubscribeTeam = onSnapshot(teamQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalTeamMembers: snapshot.docs.length,
      }));
    });
    unsubscribers.push(unsubscribeTeam);

    setIsLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Calendar Events',
      icon: Calendar,
      total: stats.totalEvents,
      approved: stats.approvedEvents,
      pending: stats.pendingEvents,
      color: 'text-blue-600',
    },
    {
      title: 'Stores',
      icon: Store,
      total: stats.totalStores,
      approved: stats.approvedStores,
      pending: stats.pendingStores,
      color: 'text-green-600',
    },
    {
      title: 'Books',
      icon: BookOpen,
      total: stats.totalBooks,
      approved: stats.approvedBooks,
      pending: stats.pendingBooks,
      color: 'text-purple-600',
    },
    {
      title: 'Organizations',
      icon: Building2,
      total: stats.totalOrganizations,
      approved: stats.approvedOrganizations,
      pending: stats.pendingOrganizations,
      color: 'text-orange-600',
    },
    {
      title: 'Reading Room',
      icon: FileText,
      total: stats.totalReadingRoomDocs,
      approved: stats.approvedReadingRoomDocs,
      pending: stats.pendingReadingRoomDocs,
      color: 'text-red-600',
    },
    {
      title: 'Team Members',
      icon: Users,
      total: stats.totalTeamMembers,
      approved: stats.totalTeamMembers,
      pending: 0,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Content Overview</h2>
        <Badge variant="outline">
          Total Items: {stats.totalEvents + stats.totalStores + stats.totalBooks + stats.totalOrganizations + stats.totalReadingRoomDocs}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    ✓ {card.approved} Approved
                  </Badge>
                  {card.pending > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ⏳ {card.pending} Pending
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
