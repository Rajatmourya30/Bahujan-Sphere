
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
  status?: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submittedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  // This field is added to pending submissions for easier display in review tables
  title?: string;
}

// This static data is no longer used by the live app but is kept for reference.
export const allBooks: Book[] = [];
