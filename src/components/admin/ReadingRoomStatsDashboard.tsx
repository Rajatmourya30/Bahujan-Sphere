'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReadingRoomStats {
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
}

export function ReadingRoomStatsDashboard() {
  const [stats, setStats] = useState<ReadingRoomStats>({
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingDocuments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all reading room documents
    const allDocsQuery = query(collection(db, 'readingRoomPdfs'));
    const unsubscribeAllDocs = onSnapshot(allDocsQuery, (snapshot) => {
      const totalDocuments = snapshot.docs.length;
      setStats(prev => ({ ...prev, totalDocuments }));
    }, (error) => {
      console.error("Error fetching reading room documents:", error);
      setStats(prev => ({ ...prev, totalDocuments: 0 }));
    });
    unsubscribes.push(unsubscribeAllDocs);

    // Subscribe to approved documents
    const approvedDocsQuery = query(
      collection(db, 'readingRoomPdfs'),
      where('status', '==', 'approved')
    );
    const unsubscribeApprovedDocs = onSnapshot(approvedDocsQuery, (snapshot) => {
      const approvedDocuments = snapshot.docs.length;
      setStats(prev => ({ ...prev, approvedDocuments }));
    }, (error) => {
      console.error("Error fetching approved reading room documents:", error);
      setStats(prev => ({ ...prev, approvedDocuments: 0 }));
    });
    unsubscribes.push(unsubscribeApprovedDocs);

    // Subscribe to pending documents
    const pendingDocsQuery = query(
      collection(db, 'readingRoomPdfs'),
      where('status', '==', 'pending')
    );
    const unsubscribePendingDocs = onSnapshot(pendingDocsQuery, (snapshot) => {
      const pendingDocuments = snapshot.docs.length;
      setStats(prev => ({ ...prev, pendingDocuments }));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching pending reading room documents:", error);
      setStats(prev => ({ ...prev, pendingDocuments: 0 }));
      setIsLoading(false);
    });
    unsubscribes.push(unsubscribePendingDocs);

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
      title: 'Total Documents',
      icon: FileText,
      value: stats.totalDocuments,
      description: 'All reading room documents',
      color: 'text-blue-600',
    },
    {
      title: 'Approved Documents',
      icon: CheckCircle,
      value: stats.approvedDocuments,
      description: 'Available to users',
      color: 'text-green-600',
    },
    {
      title: 'Pending Documents',
      icon: Clock,
      value: stats.pendingDocuments,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reading Room Statistics</h2>
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
