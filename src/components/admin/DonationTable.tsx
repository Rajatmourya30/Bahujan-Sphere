
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { format } from 'date-fns';

export interface Donation {
    id: number;
    userName: string;
    amount: number;
    paymentMethod: 'UPI' | 'Card' | 'PayPal';
    timestamp: string;
}

interface DonationTableProps {
    donations: Donation[];
}

const methodVariant: Record<Donation['paymentMethod'], 'default' | 'secondary' | 'outline'> = {
    'UPI': 'default',
    'Card': 'secondary',
    'PayPal': 'outline',
}

export function DonationTable({ donations }: DonationTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User Name</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {donations.map((donation) => (
                            <TableRow key={donation.id}>
                                <TableCell className="font-medium">
                                    {donation.userName}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    ₹{donation.amount.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={methodVariant[donation.paymentMethod]}>
                                        {donation.paymentMethod}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {format(new Date(donation.timestamp), 'dd MMM yyyy, hh:mm a')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
