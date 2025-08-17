
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
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Image from "next/image";
import { useLanguage } from "@/hooks/use-language";
import type { KnowledgeOrganization } from "@/lib/knowledge-hub";

interface KnowledgeHubTableProps {
    organizations: KnowledgeOrganization[];
    onEdit: (organization: KnowledgeOrganization) => void;
    onRemove: (organizationId: string) => void;
}

export function KnowledgeHubTable({ organizations, onEdit, onRemove }: KnowledgeHubTableProps) {
    const { t } = useLanguage();

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Description</TableHead>
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
                                                alt={t(org.nameKey)}
                                                fill
                                                className="object-contain p-1"
                                                data-ai-hint={org.imageAiHint}
                                            />
                                        </div>
                                        <span className="font-bold">{t(org.nameKey)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-md">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {t(org.descriptionKey)}
                                    </p>
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
                                            <DropdownMenuItem onClick={() => onEdit(org)}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onClick={() => onRemove(org.id)}
                                            >
                                                Remove
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
    );
}
