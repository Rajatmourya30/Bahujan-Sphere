
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
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Image from "next/image";
import type { KnowledgeOrganization } from "@/lib/knowledge-hub";
import { Badge } from "../ui/badge";

interface KnowledgeHubTableProps {
    organizations: KnowledgeOrganization[];
    onEdit: (organization: KnowledgeOrganization) => void;
    onRemove: (organizationId: string) => void;
}

export function KnowledgeHubTable({ organizations, onEdit, onRemove }: KnowledgeHubTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.map((org) => (
                            <TableRow key={org.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border">
                                            <Image
                                                src={org.logoUrl}
                                                alt={org.name}
                                                fill
                                                className="object-contain p-1"
                                                data-ai-hint={org.imageAiHint}
                                            />
                                        </div>
                                        <span className="font-bold">{org.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{org.category}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => onEdit(org)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => onRemove(org.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
