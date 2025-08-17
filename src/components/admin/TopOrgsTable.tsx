
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const topOrgs = [
    { rank: 1, name: 'Samata Sainik Dal', views: 480, shares: 45 },
    { rank: 2, name: 'All India Independent Scheduled Castes Federation', views: 350, shares: 32 },
    { rank: 3, name: 'Bahujan Vidyarthi Sangh', views: 210, shares: 15 },
];


export function TopOrgsTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Viewed Organizations</CardTitle>
                <CardDescription>Organizations with the highest engagement.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Organization Name</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Shares</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topOrgs.map((org) => (
                            <TableRow key={org.rank}>
                                <TableCell className="font-medium text-center">{org.rank}</TableCell>
                                <TableCell>{org.name}</TableCell>
                                <TableCell className="text-right">{org.views.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{org.shares.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

    