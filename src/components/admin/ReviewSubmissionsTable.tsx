
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Check, X } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';


export interface PendingEvent {
    id: string;
    title: string;
    submittedBy: string;
    submittedAt: string;
    date: string;
    summary: string;
}

interface ReviewSubmissionsTableProps {
    events: PendingEvent[];
    onReview: (eventId: string, action: 'approve' | 'reject') => void;
}

export function ReviewSubmissionsTable({ events, onReview }: ReviewSubmissionsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Event Details</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events.map((event) => (
                    <TableRow key={event.id}>
                        <TableCell className="font-medium max-w-xs">
                            <div className="font-bold">{event.title}</div>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                                {event.summary}
                            </p>
                        </TableCell>
                        <TableCell>
                            <div>{event.submittedBy}</div>
                             <div className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(event.submittedAt), { addSuffix: true })}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{event.date}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-600/40 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => onReview(event.id, 'approve')}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600/40 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => onReview(event.id, 'reject')}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
