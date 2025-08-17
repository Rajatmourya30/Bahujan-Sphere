
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

const topEvents = [
    { rank: 1, title: 'Birth of Dr. B. R. Ambedkar', views: 2450, shares: 150 },
    { rank: 2, title: 'Dhamma Chakra Pravartan Din', views: 1890, shares: 120 },
    { rank: 3, title: 'Constitution Day', views: 1530, shares: 95 },
    { rank: 4, title: 'Birth of Savitribai Phule', views: 1210, shares: 80 },
    { rank: 5, title: 'Periyar Self-Respect Conference', views: 980, shares: 60 },
];


export function TopEventsTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Most Viewed Events</CardTitle>
                <CardDescription>Events with the highest engagement.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Event Title</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Shares</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topEvents.map((event) => (
                            <TableRow key={event.rank}>
                                <TableCell className="font-medium text-center">{event.rank}</TableCell>
                                <TableCell>{event.title}</TableCell>
                                <TableCell className="text-right">{event.views.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{event.shares.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
