
import type { TranslationKey } from './i18n/translations';

export interface BahujanStore {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl: string;
  imageStoragePath?: string;
  storeUrl: string;
  imageAiHint: string;
}

export const allBahujanStores: BahujanStore[] = [
    {
        id: 'store-1',
        nameKey: 'store_name_1',
        descriptionKey: 'store_desc_1',
        imageUrl: 'https://placehold.co/400x400.png',
        storeUrl: '#',
        imageAiHint: 'store logo'
    },
    {
        id: 'store-2',
        nameKey: 'store_name_2',
        descriptionKey: 'store_desc_2',
        imageUrl: 'https://placehold.co/400x400.png',
        storeUrl: '#',
        imageAiHint: 'bookstore'
    },
    {
        id: 'store-3',
        nameKey: 'store_name_3',
        descriptionKey: 'store_desc_3',
        imageUrl: 'https://placehold.co/400x400.png',
        storeUrl: '#',
        imageAiHint: 'art supplies'
    },
    {
        id: 'store-4',
        nameKey: 'store_name_4',
        descriptionKey: 'store_desc_4',
        imageUrl: 'https://placehold.co/400x400.png',
        storeUrl: '#',
        imageAiHint: 't-shirt'
    }
]
