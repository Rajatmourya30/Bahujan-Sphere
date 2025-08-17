
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useLanguage } from "@/hooks/use-language";
import type { CalendarEvent } from "@/lib/events";
import { Badge } from "../ui/badge";

interface EventManagementTableProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onRemove: (eventId: string) => void;
    onAdd: () => void;
}

export function EventManagementTable({ events, onEdit, onRemove, onAdd }: EventManagementTableProps) {
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Existing Events</CardTitle>
                    <CardDescription>View, edit, or remove current events.</CardDescription>
                </div>
                <Button onClick={onAdd} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Event
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">
                                    <span className="font-bold">{t(event.titleKey)}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {event.tagKeys.map(tagKey => (
                                            <Badge key={tagKey} variant="secondary">{t(tagKey)}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-md">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {t(event.descriptionKey)}
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
                                            <DropdownMenuItem onClick={() => onEdit(event)}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onClick={() => onRemove(event.id)}
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
