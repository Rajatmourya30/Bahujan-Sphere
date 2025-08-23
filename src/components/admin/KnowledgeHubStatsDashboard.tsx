'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CheckCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface KnowledgeHubStats {
  totalOrganizations: number;
  approvedOrganizations: number;
  pendingOrganizations: number;
}

export function KnowledgeHubStatsDashboard() {
  const [stats, setStats] = useState<KnowledgeHubStats>({
    totalOrganizations: 0,
    approvedOrganizations: 0,
    pendingOrganizations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all organizations
    const allOrgsQuery = query(collection(db, 'knowledgeHub'));
    const unsubscribeAllOrgs = onSnapshot(allOrgsQuery, (snapshot) => {
      const totalOrganizations = snapshot.docs.length;
      setStats(prev => ({ ...prev, totalOrganizations }));
    }, (error) => {
      console.error("Error fetching organizations:", error);
      setStats(prev => ({ ...prev, totalOrganizations: 0 }));
    });
    unsubscribes.push(unsubscribeAllOrgs);

    // Subscribe to approved organizations
    const approvedOrgsQuery = query(
      collection(db, 'knowledgeHub'),
      where('status', '==', 'approved')
    );
    const unsubscribeApprovedOrgs = onSnapshot(approvedOrgsQuery, (snapshot) => {
      const approvedOrganizations = snapshot.docs.length;
      setStats(prev => ({ ...prev, approvedOrganizations }));
    }, (error) => {
      console.error("Error fetching approved organizations:", error);
      setStats(prev => ({ ...prev, approvedOrganizations: 0 }));
    });
    unsubscribes.push(unsubscribeApprovedOrgs);

    // Subscribe to pending organizations
    const pendingOrgsQuery = query(
      collection(db, 'knowledgeHub'),
      where('status', '==', 'pending')
    );
    const unsubscribePendingOrgs = onSnapshot(pendingOrgsQuery, (snapshot) => {
      const pendingOrganizations = snapshot.docs.length;
      setStats(prev => ({ ...prev, pendingOrganizations }));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching pending organizations:", error);
      setStats(prev => ({ ...prev, pendingOrganizations: 0 }));
      setIsLoading(false);
    });
    unsubscribes.push(unsubscribePendingOrgs);

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
      title: 'Total Organizations',
      icon: Building2,
      value: stats.totalOrganizations,
      description: 'All organizations',
      color: 'text-blue-600',
    },
    {
      title: 'Approved Organizations',
      icon: CheckCircle,
      value: stats.approvedOrganizations,
      description: 'Listed in knowledge hub',
      color: 'text-green-600',
    },
    {
      title: 'Pending Organizations',
      icon: Clock,
      value: stats.pendingOrganizations,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Knowledge Hub Statistics</h2>
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
