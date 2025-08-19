
'use client';

import { useState } from 'react';
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
import { EditRoleDialog } from './EditRoleDialog';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import type { Timestamp } from 'firebase/firestore';


export type TeamMemberRole = 'Admin' | 'Editor' | 'Reviewer' | 'Contributor';

export interface TeamMember {
    name: string;
    email: string;
    role: TeamMemberRole;
    joinedAt: Timestamp;
}

export interface TeamMemberWithId extends TeamMember {
    id: string;
}


interface TeamMemberTableProps {
    members: TeamMemberWithId[];
    onUpdateRole: (member: TeamMemberWithId, newRole: TeamMemberRole) => void;
    onRemoveMember: (member: TeamMemberWithId) => void;
}

const roleVariant: Record<TeamMemberRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'Admin': 'default',
    'Editor': 'secondary',
    'Reviewer': 'outline',
    'Contributor': 'destructive',
}

const rolePermissions: Record<TeamMemberRole, string[]> = {
    'Admin': ['Full Access'],
    'Editor': ['Submit Events', 'Approve Submissions', 'Edit Events'],
    'Reviewer': ['Review Submissions', 'Suggest Edits'],
    'Contributor': ['Submit Events for Review'],
};


export function TeamMemberTable({ members, onUpdateRole, onRemoveMember }: TeamMemberTableProps) {
    const [editingMember, setEditingMember] = useState<TeamMemberWithId | null>(null);
    const [removingMember, setRemovingMember] = useState<TeamMemberWithId | null>(null);

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Permissions</TableHead>
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
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {rolePermissions[member.role].map(permission => (
                                                <Badge key={permission} variant="outline" className="font-normal">
                                                    {permission}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {member.joinedAt?.toDate().toLocaleDateString() || 'N/A'}
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
                                                <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                                    Edit Role
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                  onClick={() => setRemovingMember(member)}
                                                >
                                                  Remove Member
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {editingMember && (
                <EditRoleDialog
                    member={editingMember}
                    onOpenChange={(isOpen) => !isOpen && setEditingMember(null)}
                    onSave={(newRole) => {
                        onUpdateRole(editingMember, newRole);
                        setEditingMember(null);
                    }}
                />
            )}
            {removingMember && (
                <RemoveMemberDialog
                    member={removingMember}
                    onOpenChange={(isOpen) => !isOpen && setRemovingMember(null)}
                    onConfirm={() => {
                        onRemoveMember(removingMember);
                        setRemovingMember(null);
                    }}
                />
            )}
        </>
    );
}
