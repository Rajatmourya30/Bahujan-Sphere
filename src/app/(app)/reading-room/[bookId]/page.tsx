
'use client';

import { useParams } from 'next/navigation';
import { allBooks, type Book } from '@/lib/books';
import { useLanguage } from '@/hooks/use-language';
import { PdfViewer } from '@/components/reading-room/PdfViewer';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReadingRoomBookPage() {
    const params = useParams();
    const { t } = useLanguage();
    const bookId = params.bookId as string;

    const book = allBooks.find(b => b.id === bookId);

    if (!book) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-[80vh] w-full" />
            </div>
        );
    }
    
    if (!book.pdfUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="font-headline text-2xl font-bold">{t('reading_room.not_available_title')}</h1>
                <p className="mt-2 text-muted-foreground">{t('reading_room.not_available_desc')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <header>
                <h1 className="font-headline text-3xl font-bold">{t(book.titleKey)}</h1>
                <p className="text-muted-foreground">{t(book.authorKey)}</p>
            </header>
            <div className="w-full h-[80vh] bg-muted rounded-md overflow-hidden">
                <PdfViewer file={book.pdfUrl} />
            </div>
        </div>
    );
}
