
import type { TranslationKey } from './i18n/translations';

export interface CalendarEvent {
  id: string;
  day: number;
  titleKey: TranslationKey;
  tagKeys: TranslationKey[];
  descriptionKey: TranslationKey;
  readMoreUrl: string;
}

export const mockEventsByDay: Record<string, CalendarEvent[]> = {
  '14': [
    {
      id: 'event-ambedkar-birth',
      day: 14,
      titleKey: 'event_ambedkar_birth_title',
      tagKeys: ['tag_ambedkarite'],
      descriptionKey: 'event_ambedkar_birth_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/B._R._Ambedkar'
    },
    {
      id: 'event-dhamma-chakra',
      day: 14,
      titleKey: 'event_dhamma_chakra_title',
      tagKeys: ['tag_buddhist'],
      descriptionKey: 'event_dhamma_chakra_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Dhamma_Chakra_Pravartan_Din'
    },
  ],
  '3': [
    {
      id: 'event-phule-birth',
      day: 3,
      titleKey: 'event_phule_birth_title',
      tagKeys: ['tag_social_reform'],
      descriptionKey: 'event_phule_birth_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Savitribai_Phule'
    }
  ],
  '26': [
    {
      id: 'event-constitution-day',
      day: 26,
      titleKey: 'event_constitution_day_title',
      tagKeys: ['tag_constitutional'],
      descriptionKey: 'event_constitution_day_desc',
      readMoreUrl: 'https://en.wikipedia.org/wiki/Constitution_Day_(India)'
    }
  ],
};

// A flat array of all events for easy lookup
export const allEvents: CalendarEvent[] = Object.values(mockEventsByDay).flat();
