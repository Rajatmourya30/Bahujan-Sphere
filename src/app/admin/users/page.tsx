
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { UserTable } from '@/components/admin/UserTable';
import * as XLSX from 'xlsx';

const sampleUsers = [
    { id: 1, name: 'Ambedkar Fan', email: 'fan@example.com', country: 'India', state: 'Maharashtra', city: 'Nagpur', birthYear: 1991 },
    { id: 2, name: 'Savitri Follower', email: 'savitri@example.com', country: 'India', state: 'Karnataka', city: 'Bengaluru', birthYear: 1985 },
    { id: 3, name: 'Jyotirao Admirer', email: 'jyotirao@example.com', country: 'India', state: 'Delhi', city: 'New Delhi', birthYear: 2000 },
    { id: 4, name: 'Birsa Supporter', email: 'birsa@example.com', country: 'India', state: 'Jharkhand', city: 'Ranchi', birthYear: 1995 },
    { id: 5, name: 'Community Member', email: 'member@example.com', country: 'India', state: 'Tamil Nadu', city: 'Chennai', birthYear: 1992 },
];


export default function UserManagementPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(sampleUsers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_data.xlsx");
  };

  if (!isAuthenticated) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <div>
        <header className="mb-8 flex justify-between items-center">
            <div>
                <Button asChild variant="ghost" className="mb-2">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">View and manage registered users.</p>
            </div>
            <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Export as XLSX
            </Button>
      </header>

      <UserTable users={sampleUsers} />
    </div>
  );
}

