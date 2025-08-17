
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { allBahujanStores, type BahujanStore } from '@/lib/store';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('store.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('store.description')}
                </p>
            </header>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {allBahujanStores.map(item => (
                    <StoreCard key={item.id} store={item} />
                ))}
            </div>

            <footer className="text-center text-sm text-muted-foreground">
                <p>{t('store.footer_text')}</p>
            </footer>
        </div>
    );
}
