
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
import type { Timestamp } from "firebase/firestore";


export interface PendingSubmission {
    id: string;
    title: string;
    submittedBy: string;
    submittedAt: Timestamp;
    // These fields might not exist on all submission types
    date?: string;
    summary?: string;
    readMoreUrl?: string;
    tags?: string[];
}

interface ReviewSubmissionsTableProps {
    submissions: PendingSubmission[];
    onReview: (submission: PendingSubmission, action: 'approve' | 'reject', reason?: string) => void;
    openRejectionDialog: (submission: PendingSubmission) => void;
}

export function ReviewSubmissionsTable({ submissions, onReview, openRejectionDialog }: ReviewSubmissionsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Submission Details</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                        <TableCell className="font-medium max-w-xs">
                            <div className="font-bold">{submission.title}</div>
                            {submission.summary && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                    {submission.summary}
                                </p>
                            )}
                        </TableCell>
                        <TableCell>
                            <div>{submission.submittedBy}</div>
                             <div className="text-sm text-muted-foreground">
                                {submission.submittedAt ? formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </div>
                        </TableCell>
                        <TableCell>
                           {submission.date && <Badge variant="outline">{submission.date}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-600/40 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => onReview(submission, 'approve')}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600/40 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => openRejectionDialog(submission)}
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

