
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, DollarSign, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DonationTable, type Donation } from '@/components/admin/DonationTable';
import * as XLSX from 'xlsx';

const sampleDonations: Donation[] = [
    { id: 1, userName: 'Ambedkar Fan', amount: 500, paymentMethod: 'UPI', timestamp: '2024-07-20T10:00:00Z' },
    { id: 2, userName: 'Savitri Follower', amount: 1000, paymentMethod: 'Card', timestamp: '2024-07-21T11:30:00Z' },
    { id: 3, userName: 'Jyotirao Admirer', amount: 250, paymentMethod: 'PayPal', timestamp: '2024-07-22T09:00:00Z' },
    { id: 4, userName: 'Birsa Supporter', amount: 100, paymentMethod: 'UPI', timestamp: '2024-07-22T14:00:00Z' },
    { id: 5, userName: 'Ambedkar Fan', amount: 200, paymentMethod: 'Card', timestamp: '2024-07-23T18:00:00Z' },
];

export default function DonationsDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const filteredDonations = useMemo(() => {
    if (!searchTerm) {
      return sampleDonations;
    }
    return sampleDonations.filter(d =>
      d.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalRevenue = useMemo(() => filteredDonations.reduce((sum, d) => sum + d.amount, 0), [filteredDonations]);
  const totalDonations = filteredDonations.length;
  const uniqueDonors = new Set(filteredDonations.map(d => d.userName)).size;


  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredDonations);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
    XLSX.writeFile(workbook, "donation_data.xlsx");
  };

  if (!isAuthenticated) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-4">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="font-headline text-3xl font-bold">Donations Dashboard</h1>
          <p className="text-muted-foreground">Track and manage all donations.</p>
        </div>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Export as XLSX
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground">From {totalDonations} donations</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+{totalDonations}</div>
                <p className="text-xs text-muted-foreground">From {uniqueDonors} unique donors</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{(totalRevenue / totalDonations || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Across all contributions</p>
            </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline text-2xl font-bold">All Donations</h2>
            <Input
                placeholder="Search by name or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>
        <DonationTable donations={filteredDonations} />
      </section>
    </div>
  );
}
