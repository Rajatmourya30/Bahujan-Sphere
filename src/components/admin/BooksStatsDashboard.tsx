'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BooksStats {
  totalBooks: number;
  approvedBooks: number;
  pendingBooks: number;
}

export function BooksStatsDashboard() {
  const [stats, setStats] = useState<BooksStats>({
    totalBooks: 0,
    approvedBooks: 0,
    pendingBooks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all books
    const allBooksQuery = query(collection(db, 'books'));
    const unsubscribeAllBooks = onSnapshot(allBooksQuery, (snapshot) => {
      const totalBooks = snapshot.docs.length;
      setStats(prev => ({ ...prev, totalBooks }));
    }, (error) => {
      console.error("Error fetching books:", error);
      setStats(prev => ({ ...prev, totalBooks: 0 }));
    });
    unsubscribes.push(unsubscribeAllBooks);

    // Subscribe to approved books
    const approvedBooksQuery = query(
      collection(db, 'books'),
      where('status', '==', 'approved')
    );
    const unsubscribeApprovedBooks = onSnapshot(approvedBooksQuery, (snapshot) => {
      const approvedBooks = snapshot.docs.length;
      setStats(prev => ({ ...prev, approvedBooks }));
    }, (error) => {
      console.error("Error fetching approved books:", error);
      setStats(prev => ({ ...prev, approvedBooks: 0 }));
    });
    unsubscribes.push(unsubscribeApprovedBooks);

    // Subscribe to pending books
    const pendingBooksQuery = query(
      collection(db, 'books'),
      where('status', '==', 'pending')
    );
    const unsubscribePendingBooks = onSnapshot(pendingBooksQuery, (snapshot) => {
      const pendingBooks = snapshot.docs.length;
      setStats(prev => ({ ...prev, pendingBooks }));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching pending books:", error);
      setStats(prev => ({ ...prev, pendingBooks: 0 }));
      setIsLoading(false);
    });
    unsubscribes.push(unsubscribePendingBooks);

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
      title: 'Total Books',
      icon: BookOpen,
      value: stats.totalBooks,
      description: 'All books in library',
      color: 'text-blue-600',
    },
    {
      title: 'Approved Books',
      icon: CheckCircle,
      value: stats.approvedBooks,
      description: 'Available to users',
      color: 'text-green-600',
    },
    {
      title: 'Pending Books',
      icon: Clock,
      value: stats.pendingBooks,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Books Statistics</h2>
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
