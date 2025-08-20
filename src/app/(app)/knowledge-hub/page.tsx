
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import type { KnowledgeOrganization } from '@/lib/knowledge-hub';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Globe, Search } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookmarkStore } from '@/hooks/use-bookmarks';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';


function OrganizationCard({ organization }: { organization: KnowledgeOrganization }) {
    const { t } = useLanguage();
    const { isBookmarked, toggleBookmark } = useBookmarkStore('knowledgeHubBookmarks');
    const name = organization.nameKey ? t(organization.nameKey) : organization.name;
    const description = organization.descriptionKey ? t(organization.descriptionKey) : organization.description;


    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                 <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                        src={organization.logoUrl}
                        alt={name}
                        fill
                        className="object-contain p-1"
                        data-ai-hint={organization.imageAiHint}
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{name}</CardTitle>
                    <CardDescription className="mt-1 text-sm">{description}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="flex items-center gap-2">
                 <Button asChild variant="outline" className="flex-grow">
                    <Link href={organization.websiteUrl} target="_blank">
                        <Globe className="mr-2" />
                        {t('knowledge_hub.visit_website_button')}
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleBookmark(organization.id)}
                    aria-label={t('event_calendar.bookmark_button')}
                    className="shrink-0"
                >
                    <Bookmark className={cn("h-5 w-5", isBookmarked(organization.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function KnowledgeHubPage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [organizations, setOrganizations] = useState<KnowledgeOrganization[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'knowledgeHub'), where('status', '==', 'approved'));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            const fetchedOrgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeOrganization));
            setOrganizations(fetchedOrgs);
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to fetch organizations:", error);
            setIsLoading(false);
        });
        
        return () => {
            unsubscribeFirestore();
        };
    }, []);

    const filteredOrganizations = useMemo(() => {
        if (!searchTerm) {
            return organizations;
        }
        return organizations.filter(org => 
            (org.nameKey ? t(org.nameKey) : org.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (org.descriptionKey ? t(org.descriptionKey) : org.description).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t, organizations]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                 </div>
            </div>
        )
    }


    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('knowledge_hub.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('knowledge_hub.description')}
                </p>
            </header>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t('knowledge_hub.search_placeholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredOrganizations.length > 0 ? (
                    filteredOrganizations.map(org => (
                        <OrganizationCard key={org.id} organization={org} />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-8 md:col-span-2">{t('knowledge_hub.no_results')}</p>
                )}
            </div>
        </div>
    );
}
