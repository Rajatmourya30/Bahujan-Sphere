'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  adminMembers: number;
}

export function TeamStatsDashboard() {
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    adminMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all team members
    const allMembersQuery = query(collection(db, 'teamMembers'));
    const unsubscribeAllMembers = onSnapshot(allMembersQuery, (snapshot) => {
      const totalMembers = snapshot.docs.length;
      setStats(prev => ({ ...prev, totalMembers }));
    }, (error) => {
      console.error("Error fetching team members:", error);
      setStats(prev => ({ ...prev, totalMembers: 0 }));
    });
    unsubscribes.push(unsubscribeAllMembers);

    // Subscribe to active members
    const activeMembersQuery = query(
      collection(db, 'teamMembers'),
      where('status', '==', 'active')
    );
    const unsubscribeActiveMembers = onSnapshot(activeMembersQuery, (snapshot) => {
      const activeMembers = snapshot.docs.length;
      setStats(prev => ({ ...prev, activeMembers }));
    }, (error) => {
      console.error("Error fetching active team members:", error);
      setStats(prev => ({ ...prev, activeMembers: 0 }));
    });
    unsubscribes.push(unsubscribeActiveMembers);

    // Subscribe to admin members
    const adminMembersQuery = query(
      collection(db, 'teamMembers'),
      where('role', '==', 'admin')
    );
    const unsubscribeAdminMembers = onSnapshot(adminMembersQuery, (snapshot) => {
      const adminMembers = snapshot.docs.length;
      setStats(prev => ({ ...prev, adminMembers }));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching admin team members:", error);
      setStats(prev => ({ ...prev, adminMembers: 0 }));
      setIsLoading(false);
    });
    unsubscribes.push(unsubscribeAdminMembers);

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
      title: 'Total Members',
      icon: Users,
      value: stats.totalMembers,
      description: 'All team members',
      color: 'text-blue-600',
    },
    {
      title: 'Active Members',
      icon: UserCheck,
      value: stats.activeMembers,
      description: 'Currently active',
      color: 'text-green-600',
    },
    {
      title: 'Admin Members',
      icon: Shield,
      value: stats.adminMembers,
      description: 'Admin privileges',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Team Statistics</h2>
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
