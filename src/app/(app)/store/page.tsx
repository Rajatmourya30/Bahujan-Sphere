
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { allStoreItems, type StoreItem } from '@/lib/store';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function StoreItemCard({ item }: { item: StoreItem }) {
    const { t } = useLanguage();

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                    <Image
                        src={item.imageUrl}
                        alt={t(item.titleKey)}
                        fill
                        className="object-cover"
                        data-ai-hint={item.imageAiHint}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-4">
                <CardTitle className="text-md font-headline">{t(item.titleKey)}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{t(item.descriptionKey)}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
                <Badge variant="secondary" className="text-lg font-bold">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)}
                </Badge>
                <Button asChild className="w-full">
                    <Link href={item.storeUrl} target="_blank">
                        {t('store.buy_now_button')}
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
            
            <div className="grid grid-cols-2 gap-4">
                {allStoreItems.map(item => (
                    <StoreItemCard key={item.id} item={item} />
                ))}
            </div>

            <footer className="text-center text-sm text-muted-foreground">
                <p>{t('store.footer_text')}</p>
            </footer>
        </div>
    );
}
