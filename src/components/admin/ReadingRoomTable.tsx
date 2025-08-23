
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
import { BookOpen, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import type { ReadingRoomPdf } from "@/app/admin/reading-room/page";
import Link from "next/link";

interface ReadingRoomTableProps {
    documents: ReadingRoomPdf[];
    onEdit: (doc: ReadingRoomPdf) => void;
    onDelete: (doc: ReadingRoomPdf) => void;
}

export function ReadingRoomTable({ documents, onEdit, onDelete }: ReadingRoomTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Document</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-16 w-12 flex-shrink-0">
                                            <Image
                                                src={doc.coverImageUrl || 'https://placehold.co/400x600.png'}
                                                alt={doc.title}
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                        </div>
                                        <span className="font-bold">{doc.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <p className="text-sm text-muted-foreground">
                                        {doc.author || 'N/A'}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/reading-room/${doc.id}`} target="_blank" rel="noopener noreferrer">
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => onEdit(doc)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => onDelete(doc)}
                                        >
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
