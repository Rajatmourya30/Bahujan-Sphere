
import { NextResponse } from 'next/server';
import { allEvents } from '@/lib/events';

export async function GET() {
  return NextResponse.json(allEvents);
}
