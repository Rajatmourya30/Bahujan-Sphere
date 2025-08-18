
'use client';

import { useParams } from 'next/navigation';
import { allBooks } from '@/lib/books';
import { PdfViewer } from '@/components/reading-room/PdfViewer';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BookViewerPage() {
  const params = useParams();
  const { t } = useLanguage();
  const bookId = params.bookId as string;

  const book = allBooks.find(b => b.id === bookId);

  if (!book || !book.pdfUrl) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle>Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The requested book could not be found or does not have a readable PDF.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
        <header className="p-4 border-b">
            <h1 className="font-headline text-2xl font-bold">{t(book.titleKey)}</h1>
            <p className="text-muted-foreground">{t(book.authorKey)}</p>
        </header>
        <div className="flex-grow">
            <PdfViewer file={book.pdfUrl} />
        </div>
    </div>
  );
}
