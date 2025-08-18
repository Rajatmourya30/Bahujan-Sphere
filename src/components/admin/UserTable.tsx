
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
import { languages } from "@/lib/i18n/languages";
import type { Timestamp } from "firebase/firestore";


export interface UserProfile {
    id: string;
    name: string;
    email: string;
    country: string;
    state: string;
    city: string;
    birthYear: number;
    language?: string;
    createdAt?: Timestamp; // This might not be present on all user docs
    lastSeen?: Timestamp; // This would require extra logic to track
}

interface UserTableProps {
    users: UserProfile[];
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
                            <TableHead className="text-right">Birth Year</TableHead>
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
                                <TableCell className="text-right">
                                    {user.birthYear}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
