
import type { CalendarEvent } from './events';

// Pre-computed Gregorian dates for major Buddhist events in 2024.
// This data can be updated annually or replaced with a dynamic calculation library in the future.
export const buddhistEvents2024: CalendarEvent[] = [
  // Universal Events
  {
    id: 'buddhist-vesak-2024',
    date: new Date('2024-05-23'),
    title: 'Vesak (Buddha Purnima)',
    summary: 'Commemorates the birth, enlightenment (nirvāṇa), and death (parinirvāṇa) of Gautama Buddha. It is the most important festival for Buddhists worldwide.',
    tags: ['Buddhism', 'Celebration', 'Gautama Buddha'],
    tradition: 'Universal',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Vesak',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'lotus flower',
  },
  {
    id: 'buddhist-magha-puja-2024',
    date: new Date('2024-02-24'),
    title: 'Magha Puja (Fourfold Assembly Day)',
    summary: 'Marks the occasion when 1,250 enlightened disciples of the Buddha gathered to hear his teachings without being summoned.',
    tags: ['Buddhism', 'Sangha', 'Dhamma'],
    tradition: 'Universal',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Māgha_Pūjā',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'monks meditating',
  },
  {
    id: 'buddhist-asalha-puja-2024',
    date: new Date('2024-07-21'),
    title: 'Asalha Puja (Dharma Day)',
    summary: 'Celebrates the Buddha\'s first sermon, known as the "Dhammacakkappavattana Sutta," where he set the Wheel of Dharma in motion.',
    tags: ['Buddhism', 'Sermon', 'Dharma'],
    tradition: 'Universal',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Asalha_Puja',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'dharma wheel',
  },

  // Theravada Events
  {
    id: 'buddhist-vassa-start-2024',
    date: new Date('2024-07-22'),
    title: 'Vassa (Rains Retreat) Begins',
    summary: 'The start of the three-month annual retreat observed by Theravada practitioners during the wet season, where monks remain in one place.',
    tags: ['Buddhism', 'Theravada', 'Retreat', 'Monasticism'],
    tradition: 'Theravada',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Vassa',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'rainy season temple',
  },
  {
    id: 'buddhist-kathina-2024',
    date: new Date('2024-10-19'),
    title: 'Kathina Ceremony',
    summary: 'A festival where lay Buddhists offer cloth and other necessities to monks. It takes place in the month following the end of Vassa.',
    tags: ['Buddhism', 'Theravada', 'Offering', 'Community'],
    tradition: 'Theravada',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Kathina',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'saffron robes offering',
  },
  
  // Mahayana Events
  {
    id: 'buddhist-bodhi-day-2024',
    date: new Date('2024-12-08'),
    title: 'Bodhi Day',
    summary: 'Commemorates the day that Gautama Buddha attained enlightenment under the Bodhi tree.',
    tags: ['Buddhism', 'Mahayana', 'Enlightenment', 'Meditation'],
    tradition: 'Mahayana',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Bodhi_Day',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'bodhi tree meditation',
  },
  {
    id: 'buddhist-ullambana-2024',
    date: new Date('2024-08-18'),
    title: 'Ullambana (Ghost Festival)',
    summary: 'A Mahayana festival where offerings are made to ancestors and the spirits of the deceased to relieve their suffering.',
    tags: ['Buddhism', 'Mahayana', 'Ancestors', 'Offering'],
    tradition: 'Mahayana',
    readMoreUrl: 'https://en.wikipedia.org/wiki/Ghost_Festival',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'lanterns festival',
  },
];
