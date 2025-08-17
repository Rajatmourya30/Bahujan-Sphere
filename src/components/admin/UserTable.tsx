
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
import { formatDistanceToNow } from 'date-fns';
import { languages } from "@/lib/i18n/languages";


interface User {
    id: number;
    name: string;
    email: string;
    country: string;
    state: string;
    city: string;
    birthYear: number;
    createdAt: string;
    lastSeen: string;
    language?: string;
}

interface UserTableProps {
    users: User[];
}

const getLanguageName = (code?: string) => {
    if (!code) return 'Unknown';
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name.split('(')[0].trim() : code;
}

export function UserTable({ users }: UserTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Last Seen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="font-bold">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div>{user.city}, {user.state}</div>
                                    <Badge variant="outline" className="mt-1">{user.country}</Badge>
                                </TableCell>
                                <TableCell>
                                    {getLanguageName(user.language)}
                                </TableCell>
                                <TableCell>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
