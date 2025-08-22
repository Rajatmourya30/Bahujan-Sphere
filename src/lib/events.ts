
import type { TranslationKey } from './i18n/translations';
import type { Timestamp } from 'firebase/firestore';

export interface CalendarEvent {
  id: string;
  date: Date | Timestamp;
  title: string;
  tags: string[];
  summary: string;
  readMoreUrl?: string;
  imageUrl?: string;
  imageStoragePath?: string;
  imageAiHint?: string;
  // Legacy fields for i18n, can be phased out
  titleKey?: TranslationKey;
  tagKeys?: TranslationKey[];
  descriptionKey?: TranslationKey;
  // New field for Buddhist events
  tradition?: 'Universal' | 'Theravada' | 'Mahayana';
}

    
