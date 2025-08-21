
import type { TranslationKey } from './i18n/translations';

export interface BahujanStore {
  id: string;
  name: string;
  description: string;
  nameKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  imageUrl: string;
  imageStoragePath?: string;
  storeUrl: string;
  imageAiHint: string;
}
