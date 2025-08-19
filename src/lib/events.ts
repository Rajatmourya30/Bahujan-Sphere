
import type { TranslationKey } from './i18n/translations';

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  tags: string[];
  summary: string;
  readMoreUrl?: string;
  // Legacy fields for i18n, can be phased out
  titleKey?: TranslationKey;
  tagKeys?: TranslationKey[];
  descriptionKey?: TranslationKey;
}
