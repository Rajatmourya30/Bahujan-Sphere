
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { type Book } from '@/lib/books';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Bookmark, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookmarkStore } from '@/hooks/use-bookmarks';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthAction } from '@/hooks/useAuthAction';

function BookCard({ book }: { book: Book }) {
    const { t } = useLanguage();
    const { isBookmarked, toggleBookmark } = useBookmarkStore('bookBookmarks');
    const { performAction, AuthActionPrompt } = useAuthAction();

    const title = book.titleKey ? t(book.titleKey) : book.title;
    const author = book.authorKey ? t(book.authorKey) : book.author;
    const description = book.descriptionKey ? t(book.descriptionKey) : '';


    return (
        <>
            <AuthActionPrompt />
            <Card className="flex flex-col">
                <CardHeader className="flex-row items-start gap-4">
                    <div className="relative h-32 w-24 flex-shrink-0">
                        <Image
                            src={book.imageUrl}
                            alt={title}
                            fill
                            sizes="96px"
                            className="object-cover rounded-md"
                            data-ai-hint={book.imageAiHint}
                        />
                    </div>
                    <div className="flex-grow">
                        <CardTitle className="font-headline text-lg">{title}</CardTitle>
                        <CardDescription className="text-sm font-medium">{author}</CardDescription>
                        <CardDescription className="mt-2 text-sm line-clamp-3">{description}</CardDescription>
                    </div>
                </CardHeader>
                <CardFooter className="mt-auto flex-col items-start gap-2">
                     <div className="flex w-full items-center gap-2">
                        <Button asChild className="flex-grow">
                            <Link href={book.affiliateUrl} target="_blank">
                                {t('books_page.buy_now_button')}
                            </Link>
                        </Button>
                         <Button
                            variant="outline"
                            size="icon"
                            onClick={() => performAction(() => toggleBookmark(book.id))}
                            aria-label={t('event_calendar.bookmark_button')}
                            className="shrink-0"
                        >
                            <Bookmark className={cn("h-5 w-5", isBookmarked(book.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </>
    )
}

export default function BooksPage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'books'), where('status', '==', 'approved'));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
            setBooks(fetchedBooks);
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to fetch books:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribeFirestore();
        };
    }, []);

    const filteredBooks = useMemo(() => {
        if (!searchTerm) {
            return books;
        }
        return books.filter(book => {
            const title = book.titleKey ? t(book.titleKey) : book.title;
            const author = book.authorKey ? t(book.authorKey) : book.author;
            const description = book.descriptionKey ? t(book.descriptionKey) : '';
            
            return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   description.toLowerCase().includes(searchTerm.toLowerCase())
        });
    }, [searchTerm, t, books]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('books_page.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('books_page.description')}
                </p>
            </header>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t('books_page.search_placeholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <>
                {filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {filteredBooks.map(item => (
                            <BookCard key={item.id} book={item} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">{t('books_page.no_results')}</p>
                )}
            </>
        </div>
    );
}
