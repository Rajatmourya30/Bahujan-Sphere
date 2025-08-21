
import type { TranslationKey } from './i18n/translations';

export interface KnowledgeOrganization {
  id: string;
  name: string;
  description: string;
  category: string;
  nameKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  categoryKey?: TranslationKey;
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
