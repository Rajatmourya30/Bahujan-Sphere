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
    description: 'The birth of Bhimrao Ramji Ambedkar, a pivotal figure in Indian history, jurist, economist, politician and social reformer who inspired the Dalit Buddhist movement and campaigned against social discrimination towards the untouchables (Dalits).',
    readMoreUrl: 'https://en.wikipedia.org/wiki/B._R._Ambedkar',
    tags: ['Ambedkarite', 'Constitutional'],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '2',
    date: '3 January 1831',
    title: 'Birth of Savitribai Phule',
    summary: 'Savitribai Phule, a social reformer, educationalist, and poet from Maharashtra, is regarded as the first female teacher of India.',
    description: 'Savitribai Phule was an Indian social reformer, educationalist, and poet from Maharashtra. Along with her husband, Jyotirao Phule in Maharashtra, she played a vital role in improving women\'s rights in India. She is considered to be the pioneer of India\'s feminist movement.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Savitribai_Phule',
    tags: ['Social Reform', 'Education'],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '3',
    date: '15 November 1875',
    title: 'Birth of Birsa Munda',
    summary: 'Birsa Munda was an Indian tribal freedom fighter, religious leader, and folk hero who belonged to the Munda tribe.',
    description: 'Birsa Munda was an Indian tribal freedom fighter, religious leader, and folk hero who belonged to the Munda tribe. He spearheaded a tribal religious millenarian movement that arose in the Bengal Presidency (now Jharkhand) in the late 19th century, during the British Raj, thereby making him an important figure in the history of the Indian independence movement.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Birsa_Munda',
    tags: ['Tribal Leaders', 'Freedom Fighter'],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '4',
    date: '14 October 1956',
    title: 'Dhamma Chakra Pravartan Din',
    summary: 'Dr. Ambedkar, along with his 365,000 followers, converted to Buddhism at Deekshabhoomi in Nagpur.',
    description: 'Dhamma Chakra Pravartan Din is a day to celebrate the Buddhist conversion of B. R. Ambedkar and approximately 600,000 followers on 14 October 1956 at Deekshabhoomi, Nagpur. It is a festival-like event in India.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Dhamma_Chakra_Pravartan_Din',
    tags: ['Buddhist', 'Ambedkarite'],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '5',
    date: '28 August 1853',
    title: 'Birth of Ayyankali',
    summary: 'Ayyankali was a social reformer who worked for the advancement of deprived untouchable people in the princely state of Travancore.',
    description: 'Ayyankali was a prominent social reformer from the princely state of Travancore, which is now part of Kerala, India. His efforts influenced many changes that improved the social wellbeing of those people, who are today often referred to as Dalits.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Ayyankali',
    tags: ['Social Reform', 'Dalit History'],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '6',
    date: '26 November 1949',
    title: 'Constitution Day (Samvidhan Divas)',
    summary: 'On this day, the Constituent Assembly of India adopted the Constitution of India, and it came into effect on 26 January 1950.',
    description: 'Constitution Day, also known as \'National Law Day\', is celebrated in India on 26 November every year to commemorate the adoption of the Constitution of India. On 26 November 1949, the Constituent Assembly of India adopted the Constitution of India, and it came into effect on 26 January 1950.',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Constitution_Day_(India)',
    tags: ['Constitutional', 'Ambedkarite'],
    imageUrl: 'https://placehold.co/600x400.png',
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
