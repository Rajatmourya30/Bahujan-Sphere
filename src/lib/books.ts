
import type { TranslationKey } from './i18n/translations';

export interface Book {
  id: string;
  titleKey: TranslationKey;
  authorKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl: string;
  imageStoragePath?: string;
  affiliateUrl: string;
  pdfUrl?: string;
  imageAiHint: string;
}

export const allBooks: Book[] = [
    {
      id: 'book-1',
      titleKey: 'book_annihilation_of_caste_title',
      authorKey: 'book_annihilation_of_caste_author',
      descriptionKey: 'book_annihilation_of_caste_desc',
      imageUrl: 'https://placehold.co/400x600.png',
      affiliateUrl: '#',
      imageAiHint: 'book cover'
    },
    {
      id: 'book-2',
      titleKey: 'book_gulamgiri_title',
      authorKey: 'book_gulamgiri_author',
      descriptionKey: 'book_gulamgiri_desc',
      imageUrl: 'https://placehold.co/400x600.png',
      affiliateUrl: '#',
      imageAiHint: 'book cover'
    },
     {
      id: 'book-3',
      titleKey: 'book_riddles_in_hinduism_title',
      authorKey: 'book_riddles_in_hinduism_author',
      descriptionKey: 'book_riddles_in_hinduism_desc',
      imageUrl: 'https://placehold.co/400x600.png',
      affiliateUrl: '#',
      imageAiHint: 'book cover'
    },
    {
      id: 'book-4',
      titleKey: 'book_who_were_the_shudras_title',
      authorKey: 'book_who_were_the_shudras_author',
      descriptionKey: 'book_who_were_the_shudras_desc',
      imageUrl: 'https://placehold.co/400x600.png',
      affiliateUrl: '#',
      imageAiHint: 'book cover'
    },
];
