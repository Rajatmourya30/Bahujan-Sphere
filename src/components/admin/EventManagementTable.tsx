
'use client';

import { useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useLanguage } from "@/hooks/use-language";
import type { CalendarEvent } from "@/lib/events";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from "date-fns";

interface EventManagementTableProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onRemove: (eventId: string) => void;
    onAdd: () => void;
}


export function EventManagementTable({ events, onEdit, onRemove, onAdd }: EventManagementTableProps) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i.toString(),
        label: new Date(0, i).toLocaleString('default', { month: 'long' }),
    }));

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const title = t(event.titleKey).toLowerCase();
            const matchesSearch = title.includes(searchTerm.toLowerCase());
            
            const eventMonth = event.date.getMonth();
            const matchesMonth = selectedMonth === 'all' || (eventMonth.toString() === selectedMonth);

            return matchesSearch && matchesMonth;
        });
    }, [events, searchTerm, selectedMonth, t]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Events</CardTitle>
                <CardDescription>View, edit, or remove current events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by event name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {months.map(month => (
                                    <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={onAdd} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Event
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">
                                        <span className="font-bold">{t(event.titleKey)}</span>
                                    </TableCell>
                                    <TableCell>{format(event.date, 'PPP')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {event.tagKeys.map(tagKey => (
                                                <Badge key={tagKey} variant="secondary">{t(tagKey)}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] sm:max-w-md">
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
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
