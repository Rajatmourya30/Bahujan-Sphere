
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { type BahujanStore } from '@/lib/store';
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

function StoreCard({ store }: { store: BahujanStore }) {
    const { t } = useLanguage();
    const router = useRouter();
    const { isBookmarked, toggleBookmark } = useBookmarkStore('storeBookmarks');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    const handleBookmarkClick = () => {
        if (isAuthenticated) {
            toggleBookmark(store.id);
        } else {
            router.push('/login');
        }
    }


    return (
        <Card className="flex flex-col text-center">
            <CardHeader className="items-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border">
                    <Image
                        src={store.imageUrl}
                        alt={t(store.nameKey)}
                        fill
                        className="object-cover"
                        data-ai-hint={store.imageAiHint}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardTitle className="font-headline text-lg">{t(store.nameKey)}</CardTitle>
                <CardDescription className="mt-2 text-sm">{t(store.descriptionKey)}</CardDescription>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <div className="flex w-full items-center gap-2">
                    <Button asChild className="flex-grow">
                        <Link href={store.storeUrl} target="_blank">
                            {t('store.visit_store_button')}
                        </Link>
                    </Button>
                     <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBookmarkClick}
                        aria-label={t('event_calendar.bookmark_button')}
                        className="shrink-0"
                    >
                        <Bookmark className={cn("h-5 w-5", isBookmarked(store.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

export default function StorePage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [stores, setStores] = useState<BahujanStore[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'stores'), where('status', '==', 'approved'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BahujanStore));
            setStores(fetchedStores);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching stores:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredStores = useMemo(() => {
        if (!searchTerm) {
            return stores;
        }
        return stores.filter(store => 
            t(store.nameKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(store.descriptionKey).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t, stores]);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('store.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('store.description')}
                </p>
            </header>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t('store.search_placeholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <>
                    {filteredStores.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredStores.map(item => (
                                <StoreCard key={item.id} store={item} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">{t('store.no_results')}</p>
                    )}

                    <footer className="text-center text-sm text-muted-foreground">
                        <p>{t('store.footer_text')}</p>
                    </footer>
                </>
            )}
        </div>
    );
}
