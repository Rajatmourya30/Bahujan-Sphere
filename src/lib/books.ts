
import type { TranslationKey } from './i18n/translations';
import type { Timestamp } from 'firebase/firestore';

export interface Book {
  id: string;
  titleKey: TranslationKey;
  authorKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl: string;
  imageStoragePath?: string;
  affiliateUrl: string;
  pdfUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submittedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

// This static data is no longer used by the live app but is kept for reference.
export const allBooks: Book[] = [
  {
    id: 'book-1',
    titleKey: 'book_annihilation_of_caste_title',
    authorKey: 'book_annihilation_of_caste_author',
    descriptionKey: 'book_annihilation_of_caste_desc',
    imageUrl: 'https://placehold.co/400x600.png',
    affiliateUrl: 'https://example.com/affiliate-link-1',
    pdfUrl: 'https://archive.org/download/annihilation-of-caste-with-a-reply-to-mahatma-gandhi-ambedkar/Annihilation-of-Caste-with-a-Reply-to-Mahatma-Gandhi-Ambedkar.pdf',
  },
  {
    id: 'book-2',
    titleKey: 'book_gulamgiri_title',
    authorKey: 'book_gulamgiri_author',
    descriptionKey: 'book_gulamgiri_desc',
    imageUrl: 'https://placehold.co/400x600.png',
    affiliateUrl: 'https://example.com/affiliate-link-2',
  },
    {
    id: 'book-3',
    titleKey: 'book_riddles_in_hinduism_title',
    authorKey: 'book_riddles_in_hinduism_author',
    descriptionKey: 'book_riddles_in_hinduism_desc',
    imageUrl: 'https://placehold.co/400x600.png',
    affiliateUrl: 'https://example.com/affiliate-link-3',
  },
  {
    id: 'book-4',
    titleKey: 'book_who_were_the_shudras_title',
    authorKey: 'book_who_were_the_shudras_author',
    descriptionKey: 'book_who_were_the_shudras_desc',
    imageUrl: 'https://placehold.co/400x600.png',
    affiliateUrl: 'https://example.com/affiliate-link-4',
  },
];
