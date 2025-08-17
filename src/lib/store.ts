
import type { TranslationKey } from './i18n/translations';

export interface StoreItem {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl: string;
  imageAiHint: string;
  price: number; // in INR
  storeUrl: string;
}

export const allStoreItems: StoreItem[] = [
  {
    id: 'book-1',
    titleKey: 'store_item_1_title',
    descriptionKey: 'store_item_1_desc',
    imageUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'book cover',
    price: 499,
    storeUrl: 'https://example.com/store/book1',
  },
  {
    id: 'tshirt-1',
    titleKey: 'store_item_2_title',
    descriptionKey: 'store_item_2_desc',
    imageUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'blue t-shirt',
    price: 799,
    storeUrl: 'https://example.com/store/tshirt1',
  },
  {
    id: 'course-1',
    titleKey: 'store_item_3_title',
    descriptionKey: 'store_item_3_desc',
    imageUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'online course',
    price: 2999,
    storeUrl: 'https://example.com/store/course1',
  },
  {
    id: 'poster-1',
    titleKey: 'store_item_4_title',
    descriptionKey: 'store_item_4_desc',
    imageUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'art poster',
    price: 249,
    storeUrl: 'https://example.com/store/poster1',
  },
];
