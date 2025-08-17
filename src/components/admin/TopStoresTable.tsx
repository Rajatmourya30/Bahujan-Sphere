
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

const topStores = [
    { rank: 1, name: 'The Dalit Store', clicks: 1250, ctr: '5.2%' },
    { rank: 2, name: 'Phule-Ambedkar Book Center', clicks: 980, ctr: '4.8%' },
    { rank: 3, name: 'Bahujan Art Collective', clicks: 850, ctr: '4.5%' },
    { rank: 4, name: 'Equality Labs Merch', clicks: 720, ctr: '4.1%' },
    { rank: 5, name: 'Ambedkarite Apparel', clicks: 610, ctr: '3.9%' },
];


export function TopStoresTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Most Clicked Stores</CardTitle>
                <CardDescription>Stores with the highest external link clicks.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Store Name</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                            <TableHead className="text-right">CTR</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topStores.map((store) => (
                            <TableRow key={store.rank}>
                                <TableCell className="font-medium text-center">{store.rank}</TableCell>
                                <TableCell>{store.name}</TableCell>
                                <TableCell className="text-right">{store.clicks.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{store.ctr}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
