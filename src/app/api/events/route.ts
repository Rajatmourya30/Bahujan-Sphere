
import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseDate } from '@/lib/date-parser';

export async function GET() {
  try {
    const q = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: parseDate(data.date),
      };
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
