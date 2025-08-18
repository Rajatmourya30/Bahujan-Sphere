
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { allKnowledgeOrganizations, type KnowledgeOrganization } from '@/lib/knowledge-hub';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function OrganizationCard({ organization }: { organization: KnowledgeOrganization }) {
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                 <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                        src={organization.logoUrl}
                        alt={t(organization.nameKey)}
                        fill
                        className="object-contain p-1"
                        data-ai-hint={organization.imageAiHint}
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{t(organization.nameKey)}</CardTitle>
                    <CardDescription className="mt-1 text-sm">{t(organization.descriptionKey)}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={organization.websiteUrl} target="_blank">
                        <Globe className="mr-2" />
                        {t('knowledge_hub.visit_website_button')}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function KnowledgeHubPage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [organizations, setOrganizations] = useState<KnowledgeOrganization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrgs = async () => {
            // Simulate API fetch
            setOrganizations(allKnowledgeOrganizations);
            setIsLoading(false);
        };
        fetchOrgs();
    }, []);

    const filteredOrganizations = useMemo(() => {
        if (!searchTerm) {
            return organizations;
        }
        return organizations.filter(org => 
            t(org.nameKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(org.descriptionKey).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t, organizations]);

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
            
            {isLoading ? (
                 <div className="grid grid-cols-1 gap-6">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                 </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredOrganizations.length > 0 ? (
                        filteredOrganizations.map(org => (
                            <OrganizationCard key={org.id} organization={org} />
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">{t('knowledge_hub.no_results')}</p>
                    )}
                </div>
            )}
        </div>
    );
}
