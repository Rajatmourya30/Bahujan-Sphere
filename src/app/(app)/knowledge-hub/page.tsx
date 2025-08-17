
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { allKnowledgeArticles, type KnowledgeArticle } from '@/lib/knowledge-hub';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { KnowledgeHubModal } from '@/components/knowledge-hub/KnowledgeHubModal';

function KnowledgeCard({ article }: { article: KnowledgeArticle }) {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const shortDescription = t(article.descriptionKey).substring(0, 150) + '...';

    return (
        <>
            <Card className="flex flex-col">
                <CardHeader>
                    {article.imageUrl && (
                         <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                            <Image
                                src={article.imageUrl}
                                alt={t(article.titleKey)}
                                fill
                                className="object-cover"
                                data-ai-hint={article.imageAiHint}
                            />
                        </div>
                    )}
                    <CardTitle className="font-headline pt-4 text-xl">{t(article.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-grow flex-col">
                    <p className="flex-grow text-sm text-muted-foreground">{shortDescription}</p>
                    <Button variant="outline" className="mt-4 w-full" onClick={() => setIsModalOpen(true)}>
                        {t('knowledge_hub.read_more_button')}
                    </Button>
                </CardContent>
            </Card>
            {isModalOpen && (
                <KnowledgeHubModal
                    article={article}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}


export default function KnowledgeHubPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('knowledge_hub.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('knowledge_hub.description')}
                </p>
            </header>
            
            <div className="grid grid-cols-1 gap-6">
                {allKnowledgeArticles.map(article => (
                    <KnowledgeCard key={article.id} article={article} />
                ))}
            </div>
        </div>
    );
}
