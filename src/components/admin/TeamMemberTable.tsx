
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
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";


interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Editor' | 'Contributor';
    joinedAt: string;
}

interface TeamMemberTableProps {
    members: TeamMember[];
}

const roleVariant: Record<TeamMember['role'], 'default' | 'secondary' | 'outline'> = {
    'Admin': 'default',
    'Editor': 'secondary',
    'Contributor': 'outline',
}

export function TeamMemberTable({ members }: TeamMemberTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                    <div className="font-bold">{member.name}</div>
                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={roleVariant[member.role]}>{member.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(member.joinedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                            <DropdownMenuItem>Remove Member</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
