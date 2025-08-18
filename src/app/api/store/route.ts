
import { NextResponse } from 'next/server';
import { allBahujanStores } from '@/lib/store';

export async function GET() {
  return NextResponse.json(allBahujanStores);
}
