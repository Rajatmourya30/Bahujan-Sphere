
import type { TranslationKey } from './i18n/translations';

export interface Book {
  id: string;
  title: string;
  author: string;
  titleKey?: TranslationKey;
  authorKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  imageUrl: string;
  imageStoragePath?: string;
  affiliateUrl: string;
  pdfUrl?: string;
  imageAiHint: string;
}
