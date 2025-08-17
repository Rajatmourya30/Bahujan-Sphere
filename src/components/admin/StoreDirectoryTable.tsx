
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
import type { BahujanStore } from "@/lib/store";

interface StoreDirectoryTableProps {
    stores: BahujanStore[];
    onEdit: (store: BahujanStore) => void;
    onRemove: (storeId: string) => void;
}

export function StoreDirectoryTable({ stores, onEdit, onRemove }: StoreDirectoryTableProps) {
    const { t } = useLanguage();

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Store</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stores.map((store) => (
                            <TableRow key={store.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border">
                                            <Image
                                                src={store.imageUrl}
                                                alt={t(store.nameKey)}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={store.imageAiHint}
                                            />
                                        </div>
                                        <span className="font-bold">{t(store.nameKey)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-md">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {t(store.descriptionKey)}
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
                                            <DropdownMenuItem onClick={() => onEdit(store)}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onClick={() => onRemove(store.id)}
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
