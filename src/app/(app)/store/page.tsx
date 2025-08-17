
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { allBahujanStores, type BahujanStore } from '@/lib/store';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

function StoreCard({ store }: { store: BahujanStore }) {
    const { t } = useLanguage();

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
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={store.storeUrl} target="_blank">
                        {t('store.visit_store_button')}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function StorePage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStores = useMemo(() => {
        if (!searchTerm) {
            return allBahujanStores;
        }
        return allBahujanStores.filter(store => 
            t(store.nameKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(store.descriptionKey).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t]);

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

            {filteredStores.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
        </div>
    );
}
