
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

const currentYear = new Date().getFullYear();

// This is now just sample/fallback data and not the primary source of truth.
export const allEvents: CalendarEvent[] = [
    {
      id: 'event-ambedkar-birth',
      date: new Date(currentYear, 3, 14), // April 14
      title: 'Birth of Dr. B. R. Ambedkar',
      tags: ['Ambedkarite'],
      summary: "The birth of Bhimrao Ramji Ambedkar, a pivotal figure in Indian history, jurist, economist, politician and social reformer.",
      titleKey: 'event_ambedkar_birth_title',
      tagKeys: ['tag_ambedkarite'],
      descriptionKey: 'event_ambedkar_birth_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/B._R._Ambedkar'
    },
    {
      id: 'event-dhamma-chakra',
      date: new Date(currentYear, 9, 14), // October 14
      title: 'Dhamma Chakra Pravartan Din',
      tags: ['Buddhist'],
      summary: 'A day to celebrate the Buddhist conversion of B. R. Ambedkar and his followers in 1956.',
      titleKey: 'event_dhamma_chakra_title',
      tagKeys: ['tag_buddhist'],
      descriptionKey: 'event_dhamma_chakra_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Dhamma_Chakra_Pravartan_Din'
    },
];
