
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
import { Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useLanguage } from "@/hooks/use-language";
import type { BahujanStore } from "@/lib/store";

interface StoreDirectoryTableProps {
    stores: BahujanStore[];
    onEdit: (store: BahujanStore) => void;
    onRemove: (store: BahujanStore) => void;
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
                                                alt={store.nameKey ? t(store.nameKey) : store.name || 'Store image'}
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                                data-ai-hint={store.imageAiHint}
                                            />
                                        </div>
                                        <span className="font-bold">{store.nameKey ? t(store.nameKey) : store.name || 'Store'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-md">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {store.descriptionKey ? t(store.descriptionKey) : store.description || ''}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => onEdit(store)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => onRemove(store)}>
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
