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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { MoreHorizontal, Shield, Users, Eye, Edit, FileText, Calendar, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { EditRoleDialog } from './EditRoleDialog';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { Timestamp } from 'firebase/firestore';
import type { TeamMemberRole } from '@/lib/team';
import { ROLE_DEFINITIONS, canUserManageRole } from '@/lib/roles';

export interface TeamMemberWithId {
    id: string;
    name: string;
    email: string;
    role: TeamMemberRole;
    joinedAt: Timestamp;
}

interface EnhancedTeamMemberTableProps {
    members: TeamMemberWithId[];
    onUpdateRole: (member: TeamMemberWithId, newRole: TeamMemberRole) => void;
    onRemoveMember: (member: TeamMemberWithId) => void;
    currentUserRole: TeamMemberRole;
    currentUserEmail: string;
}

const getRoleIcon = (role: TeamMemberRole) => {
    switch (role) {
        case 'Admin':
            return <Shield className="h-4 w-4" />;
        case 'Manager':
            return <Users className="h-4 w-4" />;
        case 'Editor':
            return <Edit className="h-4 w-4" />;
        case 'Reviewer':
            return <Eye className="h-4 w-4" />;
        case 'Contributor':
            return <FileText className="h-4 w-4" />;
        default:
            return <Users className="h-4 w-4" />;
    }
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export function EnhancedTeamMemberTable({ 
    members, 
    onUpdateRole, 
    onRemoveMember, 
    currentUserRole,
    currentUserEmail 
}: EnhancedTeamMemberTableProps) {
    const [editingMember, setEditingMember] = useState<TeamMemberWithId | null>(null);
    const [removingMember, setRemovingMember] = useState<TeamMemberWithId | null>(null);

    const canManageMember = (member: TeamMemberWithId) => {
        // Can't manage yourself
        if (member.email === currentUserEmail) return false;
        // Can only manage roles below your level
        return canUserManageRole(currentUserRole, member.role);
    };

    const sortedMembers = [...members].sort((a, b) => {
        // Sort by role level (highest first), then by name
        const aLevel = ROLE_DEFINITIONS[a.role].level;
        const bLevel = ROLE_DEFINITIONS[b.role].level;
        if (aLevel !== bLevel) return bLevel - aLevel;
        return a.name.localeCompare(b.name);
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members ({members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role & Level</TableHead>
                                <TableHead>Key Permissions</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedMembers.map((member) => {
                                const roleDefinition = ROLE_DEFINITIONS[member.role];
                                const isCurrentUser = member.email === currentUserEmail;
                                const canManage = canManageMember(member);
                                
                                return (
                                    <TableRow key={member.id} className={isCurrentUser ? "bg-muted/50" : ""}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {member.name}
                                                        {isCurrentUser && (
                                                            <Badge variant="outline" className="text-xs">
                                                                You
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Badge 
                                                    variant={roleDefinition.color} 
                                                    className="flex items-center gap-1 w-fit"
                                                >
                                                    {getRoleIcon(member.role)}
                                                    {member.role}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground">
                                                    Level {roleDefinition.level}/5
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {roleDefinition.permissions.slice(0, 3).map(permission => (
                                                    <Badge key={permission} variant="outline" className="text-xs font-normal">
                                                        {permission}
                                                    </Badge>
                                                ))}
                                                {roleDefinition.permissions.length > 3 && (
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        +{roleDefinition.permissions.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="h-3 w-3" />
                                                {member.joinedAt?.toDate().toLocaleDateString() || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
