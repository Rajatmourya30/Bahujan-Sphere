
import type { TranslationKey } from './i18n/translations';

export interface CalendarEvent {
  id: string;
  date: Date;
  titleKey: TranslationKey;
  tagKeys: TranslationKey[];
  descriptionKey: TranslationKey;
  readMoreUrl: string;
}

const currentYear = new Date().getFullYear();

export const allEvents: CalendarEvent[] = [
    {
      id: 'event-ambedkar-birth',
      date: new Date(currentYear, 3, 14), // April 14
      titleKey: 'event_ambedkar_birth_title',
      tagKeys: ['tag_ambedkarite'],
      descriptionKey: 'event_ambedkar_birth_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/B._R._Ambedkar'
    },
    {
      id: 'event-dhamma-chakra',
      date: new Date(currentYear, 9, 14), // October 14
      titleKey: 'event_dhamma_chakra_title',
      tagKeys: ['tag_buddhist'],
      descriptionKey: 'event_dhamma_chakra_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Dhamma_Chakra_Pravartan_Din'
    },
    {
      id: 'event-phule-birth',
      date: new Date(currentYear, 0, 3), // January 3
      titleKey: 'event_phule_birth_title',
      tagKeys: ['tag_social_reform'],
      descriptionKey: 'event_phule_birth_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Savitribai_Phule'
    },
    {
      id: 'event-constitution-day',
      date: new Date(currentYear, 10, 26), // November 26
      titleKey: 'event_constitution_day_title',
      tagKeys: ['tag_constitutional'],
      descriptionKey: 'event_constitution_day_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Constitution_Day_(India)'
    }
];
