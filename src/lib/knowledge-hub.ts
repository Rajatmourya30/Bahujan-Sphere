
import type { TranslationKey } from './i18n/translations';

export interface KnowledgeArticle {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl?: string;
  imageAiHint?: string;
  fullArticleUrl: string;
}

export const allKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'article-1',
    titleKey: 'knowledge_article_1_title',
    descriptionKey: 'knowledge_article_1_desc',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'book library',
    fullArticleUrl: 'https://en.wikipedia.org/wiki/Ambedkarite',
  },
  {
    id: 'article-2',
    titleKey: 'knowledge_article_2_title',
    descriptionKey: 'knowledge_article_2_desc',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'protest march',
    fullArticleUrl: 'https://en.wikipedia.org/wiki/Dalit',
  },
  {
    id: 'article-3',
    titleKey: 'knowledge_article_3_title',
    descriptionKey: 'knowledge_article_3_desc',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'ancient statue',
    fullArticleUrl: 'https://en.wikipedia.org/wiki/History_of_the_Indian_caste_system',
  },
];
