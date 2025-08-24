
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
import type { Book } from "@/lib/books";

interface BookManagementTableProps {
    books: Book[];
    onEdit: (book: Book) => void;
    onRemove: (bookId: string) => void;
}

export function BookManagementTable({ books, onEdit, onRemove }: BookManagementTableProps) {
    const { t } = useLanguage();

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {books.map((book) => (
                            <TableRow key={book.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-16 w-12 flex-shrink-0">
                                            <Image
                                                src={book.imageUrl}
                                                alt={book.titleKey ? t(book.titleKey) : book.title || 'Book cover'}
                                                fill
                                                sizes="48px"
                                                className="object-cover rounded-md"
                                                data-ai-hint={book.imageAiHint}
                                            />
                                        </div>
                                        <span className="font-bold">{book.titleKey ? t(book.titleKey) : book.title || 'Book'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <p className="text-sm text-muted-foreground">
                                        {book.authorKey ? t(book.authorKey) : book.author || ''}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => onEdit(book)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => onRemove(book.id)}>
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
