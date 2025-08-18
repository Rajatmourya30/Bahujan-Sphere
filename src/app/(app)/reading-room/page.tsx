
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { allBooks, type Book } from '@/lib/books';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

function BookCard({ book }: { book: Book }) {
    const { t } = useLanguage();

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start gap-4">
                <div className="relative h-32 w-24 flex-shrink-0">
                    <Image
                        src={book.imageUrl}
                        alt={t(book.titleKey)}
                        fill
                        className="object-cover rounded-md"
                        data-ai-hint={book.imageAiHint}
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{t(book.titleKey)}</CardTitle>
                    <CardDescription className="text-sm font-medium">{t(book.authorKey)}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="mt-auto">
                 <Button asChild className="w-full" disabled={!book.pdfUrl}>
                    <Link href={`/reading-room/${book.id}`}>
                        <BookOpen className="mr-2" />
                        {book.pdfUrl ? t('reading_room.read_now_button') : t('reading_room.coming_soon_button')}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function ReadingRoomPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('reading_room.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('reading_room.description')}
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allBooks.map(item => (
                    <BookCard key={item.id} book={item} />
                ))}
            </div>
        </div>
    );
}
