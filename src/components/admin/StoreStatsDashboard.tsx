'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, CheckCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StoreStats {
  totalStores: number;
  approvedStores: number;
  pendingStores: number;
}

export function StoreStatsDashboard() {
  const [stats, setStats] = useState<StoreStats>({
    totalStores: 0,
    approvedStores: 0,
    pendingStores: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all stores
    const allStoresQuery = query(collection(db, 'stores'));
    const unsubscribeAllStores = onSnapshot(allStoresQuery, (snapshot) => {
      const totalStores = snapshot.docs.length;
      setStats(prev => ({ ...prev, totalStores }));
    }, (error) => {
      console.error("Error fetching stores:", error);
      setStats(prev => ({ ...prev, totalStores: 0 }));
    });
    unsubscribes.push(unsubscribeAllStores);

    // Subscribe to approved stores
    const approvedStoresQuery = query(
      collection(db, 'stores'),
      where('status', '==', 'approved')
    );
    const unsubscribeApprovedStores = onSnapshot(approvedStoresQuery, (snapshot) => {
      const approvedStores = snapshot.docs.length;
      setStats(prev => ({ ...prev, approvedStores }));
    }, (error) => {
      console.error("Error fetching approved stores:", error);
      setStats(prev => ({ ...prev, approvedStores: 0 }));
    });
    unsubscribes.push(unsubscribeApprovedStores);

    // Subscribe to pending stores
    const pendingStoresQuery = query(
      collection(db, 'stores'),
      where('status', '==', 'pending')
    );
    const unsubscribePendingStores = onSnapshot(pendingStoresQuery, (snapshot) => {
      const pendingStores = snapshot.docs.length;
      setStats(prev => ({ ...prev, pendingStores }));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching pending stores:", error);
      setStats(prev => ({ ...prev, pendingStores: 0 }));
      setIsLoading(false);
    });
    unsubscribes.push(unsubscribePendingStores);

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
      title: 'Total Stores',
      icon: Store,
      value: stats.totalStores,
      description: 'All stores in directory',
      color: 'text-blue-600',
    },
    {
      title: 'Approved Stores',
      icon: CheckCircle,
      value: stats.approvedStores,
      description: 'Listed publicly',
      color: 'text-green-600',
    },
    {
      title: 'Pending Stores',
      icon: Clock,
      value: stats.pendingStores,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Store Statistics</h2>
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
