
import type { TranslationKey } from './i18n/translations';

export interface KnowledgeOrganization {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  logoUrl: string;
  logoStoragePath?: string;
  websiteUrl: string;
  imageAiHint: string;
}

export interface KnowledgeArticle {
    id: string;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    fullArticleUrl: string;
}

export const allKnowledgeOrganizations: KnowledgeOrganization[] = [
    {
        id: 'org-1',
        nameKey: 'org_1_name',
        descriptionKey: 'org_1_desc',
        logoUrl: 'https://placehold.co/400x400.png',
        websiteUrl: '#',
        imageAiHint: 'organization logo'
    },
    {
        id: 'org-2',
        nameKey: 'org_2_name',
        descriptionKey: 'org_2_desc',
        logoUrl: 'https://placehold.co/400x400.png',
        websiteUrl: '#',
        imageAiHint: 'organization logo'
    },
    {
        id: 'org-3',
        nameKey: 'org_3_name',
        descriptionKey: 'org_3_desc',
        logoUrl: 'https://placehold.co/400x400.png',
        websiteUrl: '#',
        imageAiHint: 'organization logo'
    }
]
