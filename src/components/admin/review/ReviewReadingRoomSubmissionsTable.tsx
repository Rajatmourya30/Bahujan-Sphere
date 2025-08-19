
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Check, Info, X } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import type { PendingSubmission } from '@/components/admin/ReviewSubmissionsTable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";

interface PendingReadingRoomItem extends PendingSubmission {
    description?: string;
    coverImageUrl?: string;
}

interface ReviewReadingRoomSubmissionsTableProps {
    submissions: PendingReadingRoomItem[];
    onReview: (submission: PendingSubmission, action: 'approve' | 'reject', reason?: string) => void;
    openRejectionDialog: (submission: PendingSubmission) => void;
}

export function ReviewReadingRoomSubmissionsTable({ submissions, onReview, openRejectionDialog }: ReviewReadingRoomSubmissionsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Submission Details</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                        <TableCell className="font-medium max-w-sm">
                            <div className="flex items-start gap-4">
                                {submission.coverImageUrl && (
                                    <div className="relative h-20 w-16 flex-shrink-0">
                                        <Image
                                            src={submission.coverImageUrl}
                                            alt={submission.title}
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <div className="font-bold flex items-center gap-2">
                                        {submission.title}
                                        {submission.description && (
                                             <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p>{submission.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                        {submission.summary}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div>{submission.submittedBy}</div>
                             <div className="text-sm text-muted-foreground">
                                {submission.submittedAt ? formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </div>
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
