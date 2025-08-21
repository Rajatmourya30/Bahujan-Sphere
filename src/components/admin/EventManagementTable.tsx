
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
import { Calendar as CalendarIcon, Edit, MoreHorizontal, PlusCircle, Search, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import type { CalendarEvent } from "@/lib/events";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format, getMonth, getDate, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";

interface EventManagementTableProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onRemove: (eventId: string) => void;
    onAdd: () => void;
}


export function EventManagementTable({ events, onEdit, onRemove, onAdd }: EventManagementTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i.toString(),
        label: new Date(0, i).toLocaleString('default', { month: 'long' }),
    }));
    
    const years = useMemo(() => {
        const eventYears = new Set(events.map(event => isValid(event.date) ? event.date.getFullYear() : 0).filter(y => y > 0));
        return Array.from(eventYears).sort((a, b) => b - a);
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (!isValid(event.date)) return false;

            const title = event.title?.toLowerCase() || '';
            const matchesSearch = title.includes(searchTerm.toLowerCase());
            
            const eventMonth = event.date.getMonth().toString();
            const matchesMonth = selectedMonth === 'all' || eventMonth === selectedMonth;

            const eventYear = event.date.getFullYear().toString();
            const matchesYear = selectedYear === 'all' || eventYear === selectedYear;

            const matchesDate = !selectedDate || (getMonth(event.date) === getMonth(selectedDate) && getDate(event.date) === getDate(selectedDate));

            return matchesSearch && matchesMonth && matchesYear && matchesDate;
        });
    }, [events, searchTerm, selectedMonth, selectedYear, selectedDate]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedMonth('all');
        setSelectedYear('all');
        setSelectedDate(undefined);
    };

    const hasActiveFilters = searchTerm || selectedMonth !== 'all' || selectedYear !== 'all' || selectedDate;


    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Events</CardTitle>
                <CardDescription>View, edit, or remove current events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 sm:w-48"
                            />
                        </div>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-[150px]">
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
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="Filter by year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-auto justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>By date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                     <Button onClick={onAdd} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Event
                    </Button>
                </div>
                
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="max-w-md">Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">
                                        <span className="font-bold">{event.title}</span>
                                    </TableCell>
                                    <TableCell>{isValid(event.date) ? format(event.date, 'PPP') : 'Invalid Date'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {event.tags?.map(tag => (
                                                <Badge key={tag} variant="secondary">{tag}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <p className="text-sm text-muted-foreground truncate">
                                            {event.summary}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                                                <Edit className="mr-2 h-4 w-4"/>
                                                Edit
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => onRemove(event.id)}>
                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                Remove
                                            </Button>
                                        </div>
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
