
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
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

function BookCard({ book }: { book: Book }) {
    const { t } = useLanguage();
    const router = useRouter();
    const { isBookmarked, toggleBookmark } = useBookmarkStore('bookBookmarks');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    const handleBookmarkClick = () => {
        if (isAuthenticated) {
            toggleBookmark(book.id);
        } else {
            router.push('/login');
        }
    }


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
                    <CardDescription className="mt-2 text-sm line-clamp-3">{t(book.descriptionKey)}</CardDescription>
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
                        onClick={handleBookmarkClick}
                        aria-label={t('event_calendar.bookmark_button')}
                        className="shrink-0"
                    >
                        <Bookmark className={cn("h-5 w-5", isBookmarked(book.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

export default function BooksPage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'books'), where('status', '==', 'approved'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
          setBooks(fetchedBooks);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching books:", error);
          setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredBooks = useMemo(() => {
        if (!searchTerm) {
            return books;
        }
        return books.filter(book => 
            t(book.titleKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(book.authorKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(book.descriptionKey).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t, books]);

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

            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : (
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
            )}
        </div>
    );
}
