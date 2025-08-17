'use client';

import type { Event } from '@/lib/types';
import { EventCard } from './EventCard';
import { EventFilters } from './EventFilters';

const mockEvents: Event[] = [
  {
    id: '1',
    date: '14 April 1891',
    title: 'Birth of Dr. B. R. Ambedkar',
    summary: 'The birth of Bhimrao Ramji Ambedkar, a pivotal figure in Indian history, jurist, economist, politician and social reformer.',
    tags: ['Ambedkarite', 'Constitutional'],
    imageUrl: 'https://placehold.co/600x400.png',
    isBookmarked: false,
  },
  {
    id: '2',
    date: '3 January 1831',
    title: 'Birth of Savitribai Phule',
    summary: 'Savitribai Phule, a social reformer, educationalist, and poet from Maharashtra, is regarded as the first female teacher of India.',
    tags: ['Social Reform', 'Education'],
    imageUrl: 'https://placehold.co/600x400.png',
    isBookmarked: true,
  },
  {
    id: '3',
    date: '15 November 1875',
    title: 'Birth of Birsa Munda',
    summary: 'Birsa Munda was an Indian tribal freedom fighter, religious leader, and folk hero who belonged to the Munda tribe.',
    tags: ['Tribal Leaders', 'Freedom Fighter'],
    imageUrl: 'https://placehold.co/600x400.png',
    isBookmarked: false,
  },
  {
    id: '4',
    date: '14 October 1956',
    title: 'Dhamma Chakra Pravartan Din',
    summary: 'Dr. Ambedkar, along with his 365,000 followers, converted to Buddhism at Deekshabhoomi in Nagpur.',
    tags: ['Buddhist', 'Ambedkarite'],
    imageUrl: 'https://placehold.co/600x400.png',
    isBookmarked: false,
  },
  {
    id: '5',
    date: '28 August 1853',
    title: 'Birth of Ayyankali',
    summary: 'Ayyankali was a social reformer who worked for the advancement of deprived untouchable people in the princely state of Travancore.',
    tags: ['Social Reform', 'Dalit History'],
    imageUrl: 'https://placehold.co/600x400.png',
    isBookmarked: false,
  },
  {
    id: '6',
    date: '26 November 1949',
    title: 'Constitution Day (Samvidhan Divas)',
    summary: 'On this day, the Constituent Assembly of India adopted the Constitution of India, and it came into effect on 26 January 1950.',
    tags: ['Constitutional', 'Ambedkarite'],
    imageUrl: 'https://placehold.co/600x400.png',
    isBookmarked: true,
  },
];

export function EventList() {
  return (
    <section>
      <EventFilters />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
