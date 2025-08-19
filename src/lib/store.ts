
import type { TranslationKey } from './i18n/translations';
import type { Timestamp } from 'firebase/firestore';

export interface BahujanStore {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl: string;
  imageStoragePath?: string;
  storeUrl: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submittedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

// This static data is no longer used by the live app but is kept for reference.
export const allBahujanStores: BahujanStore[] = [
  {
    id: 'store-1',
    nameKey: 'store_name_1',
    descriptionKey: 'store_desc_1',
    imageUrl: 'https://placehold.co/400x400.png',
    storeUrl: 'https://www.thedalitstore.com/',
  },
  {
    id: 'store-2',
    nameKey: 'store_name_2',
    descriptionKey: 'store_desc_2',
    imageUrl: 'https://placehold.co/400x400.png',
    storeUrl: 'https://www.navayana.org/',
  },
  {
    id: 'store-3',
    nameKey: 'store_name_3',
    descriptionKey: 'store_desc_3',
    imageUrl: 'https://placehold.co/400x400.png',
    storeUrl: 'https://www.instagram.com/bahujanartproject/',
  },
  {
    id: 'store-4',
    nameKey: 'store_name_4',
    descriptionKey: 'store_desc_4',
    imageUrl: 'https://placehold.co/400x400.png',
    storeUrl: 'https://www.equalitylabs.org/store',
  },
];
